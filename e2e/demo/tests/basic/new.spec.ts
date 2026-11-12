import { test, expect, Browser, Page } from '@playwright/test';
import { connectAndFindEWCPage } from '../helpers/cdp-helper';
import { navigateToDemo } from '../helpers/navigation';

const CDP_PORT = parseInt(process.env.CDP_PORT || '8080', 10);

// DemoNew (test-apps/demo/DemoNew.aplf): ⎕NEW-style code on eNEW. Objects are
// unnamed, so EWC gives them hidden IDs (_Form1, _Form1._Button1, …); children
// made with f.eNEW / f.(x←eNEW …) nest under the form. The onSelect callback
// (CBNew) gets a ref to the button, as ⎕NEW's onEvent syntax does, and uses
// it with eWG/eWS to write into the label.
test.describe('DemoNew', () => {
  let browser: Browser;
  let page: Page;

  const FORM = '#_Form1';
  const EDIT = '#_Form1\\._Edit1';
  const BUTTON = '#_Form1\\._Button1';
  const LABEL = '#_Form1\\._Label1';

  test.beforeAll(async () => {
    const result = await connectAndFindEWCPage(CDP_PORT);
    browser = result.browser;
    page = await navigateToDemo(result.page, 'New', LABEL, 10000);
  });

  test.beforeEach(async () => {
    await new Promise(r => setTimeout(r, 100));
  });

  test('eNEW children are created inside the form', async () => {
    await expect(page.locator(`${FORM} ${EDIT}`)).toBeVisible();
    await expect(page.locator(`${FORM} ${BUTTON}`)).toBeVisible();
    await expect(page.locator(LABEL)).toHaveText('Press Greet');
  });

  test('onSelect callback gets a ref and can drive eWG/eWS with it', async () => {
    await page.locator(EDIT).fill('EWC');
    await page.locator(BUTTON).click();
    await expect(page.locator(LABEL)).toHaveText('Hello, EWC! (onSelect on Greet)');
  });
});
