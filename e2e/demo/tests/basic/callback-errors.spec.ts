import { test, expect, Browser, Page } from '@playwright/test';
import { connectAndFindEWCPage } from '../helpers/cdp-helper';
import { navigateToDemo } from '../helpers/navigation';

const CDP_PORT = parseInt(process.env.CDP_PORT || '8080', 10);

// DemoCallbackErrors (test-apps/demo/DemoCallbackErrors.aplf). A callback fails
// under an application ⎕TRAP; the trap action writes what it sees into F1.OUT.
// Each case runs natively (a native Timer under ⎕DQ) and under EWC (a nested
// eDQ); the report after the "native"/"ewc" prefix must be the same.
//
// Regression: EWC ran callbacks by ⍎ing an expression (86⌶), so an error
// escaping the callback's own frame - ⎕SIGNALled there, or re-signalled by a
// handler cutting back to the caller, as GAMA's does - surfaced at that ⍎ with
// ⎕DMX empty, ⎕DM prefixed with ⍎ and EWC's frames back on the stack, and the
// trap action ran inside EWC. Natively it surfaces at the caller's ⎕DQ line.
test.describe('DemoCallbackErrors', () => {
  let browser: Browser;
  let page: Page;

  const out = () => page.locator('#F1\\.OUT');
  const report = async () => ((await out().textContent()) ?? '').replace(/^\S+ /, '');

  // Empty F1.OUT first, so each run's report is fresh: a native run's ⎕DQ is
  // still waiting on its Timer until the report appears
  const clear = async () => {
    await page.locator('#F1\\.CLEAR').click();
    await expect(out()).toHaveText('');
  };

  // Run a case natively: a native Timer's callback fails under ⎕DQ
  const nativeCase = async (button: string) => {
    await clear();
    await page.locator(`#F1\\.${button}`).click();
    await expect(out()).toHaveText(/^native /);
  };

  // Run a case under EWC: open the nested eDQ, then make its callback fail
  const ewcCase = async (button: string) => {
    await clear();
    await page.locator('#F1\\.EWC').click();
    await page.locator(`#F2\\.${button}`).click();
    await expect(out()).toHaveText(/^ewc /);
  };

  test.beforeAll(async () => {
    const result = await connectAndFindEWCPage(CDP_PORT);
    browser = result.browser;
    page = await navigateToDemo(result.page, 'CallbackErrors', '#F1\\.OUT', 10000);
  });

  test.beforeEach(async () => {
    await new Promise(r => setTimeout(r, 100));
  });

  test('native: ⎕SIGNAL in a callback surfaces at the ⎕DQ caller', async () => {
    await nativeCase('NATTOP');
    await expect(out()).toHaveText('native Top: EN=11 EM=boom DM=boom depth=+1 in=caller');
  });

  test('EWC: ⎕SIGNAL in a callback surfaces at the eDQ caller, as natively', async () => {
    await nativeCase('NATTOP');
    const native = await report();
    await ewcCase('TOP');
    expect(await report()).toBe(native);
  });

  test('native: an error deeper down is trapped where it happened', async () => {
    await nativeCase('NATDEEP');
    await expect(out()).toHaveText('native Deep: EN=11 EM=DOMAIN ERROR DM=DOMAIN ERROR depth=+3 in=CBErrDiv');
  });

  test('EWC: an error deeper down is trapped where it happened, as natively', async () => {
    await nativeCase('NATDEEP');
    const native = await report();
    await ewcCase('DEEP');
    expect(await report()).toBe(native);
  });
});
