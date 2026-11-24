import { test, expect, Browser, Page } from '@playwright/test';
import { connectAndFindEWCPage } from '../helpers/cdp-helper';
import { navigateToDemo } from '../helpers/navigation';
import { openInjectablePage } from '../helpers/ws-inject';

const CDP_PORT = parseInt(process.env.CDP_PORT || '8080', 10);

test.describe('DemoTextSize', () => {
  let browser: Browser;
  let page: Page;

  test.beforeAll(async () => {
    const result = await connectAndFindEWCPage(CDP_PORT);
    browser = result.browser;
    page = await navigateToDemo(result.page, 'TextSize', '#F1', 10000);
  });

  test.beforeEach(async () => {
    // Small delay before each test to let EWC server settle
    await new Promise(r => setTimeout(r, 100));
  });

  test('displays multi-line text with bounding box', async () => {
    // F1.HW shows "Hello to\nall of the World"
    // Note: EWC renders text with overlays, use toBeAttached() not toBeVisible()
    const helloWorld = page.locator('#F1\\.HW');
    await expect(helloWorld).toBeAttached();

    // F1.HWBX is the bounding rectangle
    const hwBox = page.locator('#F1\\.HWBX');
    await expect(hwBox).toBeAttached();
  });

  test('displays text with custom font', async () => {
    // F1.H shows "Hello everyone, EWC Rocks!" with custom font
    const customText = page.locator('#F1\\.H');
    await expect(customText).toBeAttached();

    // F1.HBX is its bounding rectangle
    const hBox = page.locator('#F1\\.HBX');
    await expect(hBox).toBeAttached();
  });

  test('displays single line text', async () => {
    // F1.ONE shows "One Line"
    const oneLine = page.locator('#F1\\.ONE');
    await expect(oneLine).toBeAttached();
  });

  // A ⎕WC Font immediately followed by GetTextSize must measure with that font.
  // Both frames are injected in one tick — the race that made the visual test flaky.
  test('GetTextSize sees a Font created just before it', async () => {
    const inj = await openInjectablePage(browser, 'TextSize', '#F1');
    try {
      const measure = (withFont: boolean, wgid: string) =>
        inj.page.evaluate(({ withFont, wgid }) => {
          const ws = (window as any).__EWC_WS__.find((s: WebSocket) => typeof s.onmessage === 'function');
          return new Promise<number[]>((resolve) => {
            const send = ws.send.bind(ws);
            ws.send = (data: string) => {
              const wx = JSON.parse(data).WX;
              if (wx?.WGID !== wgid) return send(data);
              ws.send = send;
              resolve(wx.Info);
            };
            if (withFont) {
              ws.onmessage({ data: JSON.stringify({ WC: { ID: 'F1.RACEFNT', Properties: { Type: 'Font', PName: 'Segoe UI', Size: 20 } } }) });
            }
            ws.onmessage({ data: JSON.stringify({ WX: { Method: 'GetTextSize', Info: [['Hello everyone', 'F1.RACEFNT']], WGID: wgid } }) });
          });
        }, { withFont, wgid });

      const racing = await measure(true, 'race-1');
      await inj.page.waitForTimeout(300); // WC applies a frame later
      const settled = await measure(false, 'race-2');
      expect(racing).toEqual(settled);
    } finally {
      await inj.dispose();
    }
  });

  test('visual regression - textsize demo', async () => {
    await expect(page).toHaveScreenshot('textsize-demo.png');
  });
});
