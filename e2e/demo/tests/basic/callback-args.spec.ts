import { test, expect, Browser, Page } from '@playwright/test';
import { connectAndFindEWCPage } from '../helpers/cdp-helper';
import { navigateToDemo } from '../helpers/navigation';

const CDP_PORT = parseInt(process.env.CDP_PORT || '8080', 10);

// DemoCallbackArgs (test-apps/demo/DemoCallbackArgs.aplf). Each button's
// callback writes what it was called with into F1.OUT.
//
// Regression: an Event registered with an extra array must call an AMBIVALENT
// callback ({⍺}fn) dyadically, extra on the left - exactly as native ⎕WC does,
// and as a dyadic one. EWC once treated only valence 2 as dyadic (⎕AT reports
// ambivalent as ¯2), so an ambivalent callback got the extra appended to its
// right argument instead - which broke GAMA's Share/option ribbon button.
//
// Regression: Root's events bound through eWS must name a function in the
// application's namespace, not #.EWC - ⎕WS resolves the name where it runs.
// Any Root/#/⎕SE event was affected; WinIniChange is the one GAMA binds, and
// it fires unprompted - resuming from sleep - so ⎕DQ died "at random".
test.describe('DemoCallbackArgs', () => {
  let browser: Browser;
  let page: Page;

  const out = () => page.locator('#F1\\.OUT');

  test.beforeAll(async () => {
    const result = await connectAndFindEWCPage(CDP_PORT);
    browser = result.browser;
    page = await navigateToDemo(result.page, 'CallbackArgs', '#F1\\.OUT', 10000);
  });

  test.beforeEach(async () => {
    await new Promise(r => setTimeout(r, 100));
  });

  test('dyadic callback gets the extra as its left argument', async () => {
    await page.locator('#F1\\.DYA').click();
    await expect(out()).toHaveText('dyadic: ⍺=466 ≢⍵=2 event=Select');
  });

  test('ambivalent callback is called dyadically when there is an extra', async () => {
    await page.locator('#F1\\.AMB').click();
    await expect(out()).toHaveText('ambivalent, dyadic: ⍺=466 ≢⍵=2 event=Select');
  });

  test('ambivalent callback is called monadically when there is no extra', async () => {
    await page.locator('#F1\\.AMB0').click();
    await expect(out()).toHaveText('ambivalent, monadic: ≢⍵=2 event=Select');
  });

  // Native ⎕WC drops the extra for a monadic callback - it is not appended.
  test('monadic callback gets just the event message, extra dropped', async () => {
    await page.locator('#F1\\.MON').click();
    await expect(out()).toHaveText('monadic: ≢⍵=2 event=Select');
  });

  test('niladic callback is called with no arguments despite an extra', async () => {
    await page.locator('#F1\\.NIL').click();
    await expect(out()).toHaveText('niladic');
  });

  test('Root WinIniChange bound via eWS resolves in the app, not #.EWC', async () => {
    const root = page.locator('#F1\\.ROOT');
    await expect(root).toHaveText(/^Root WinIniChange: /);
    const text = (await root.textContent()) ?? '';
    test.skip(text.includes('unsupported'), 'No Root WinIniChange on this platform');
    expect(text).toContain('CBArgsWinIni');
    expect(text).not.toContain('EWC.');
  });

  // The failure itself: the event delivered through a real ⎕DQ, as a Windows
  // settings broadcast would. A wrong binding makes ⎕DQ signal VALUE ERROR.
  test('Root WinIniChange delivered through ⎕DQ runs the callback bound via eWS', async () => {
    const root = (await page.locator('#F1\\.ROOT').textContent()) ?? '';
    test.skip(root.includes('unsupported'), 'No Root WinIniChange on this platform');
    await page.locator('#F1\\.FIRE').click();
    await expect(out()).toHaveText('WinIniChange: callback ran, ⎕DQ survived');
  });
});
