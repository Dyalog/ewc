import { test, expect, Browser, BrowserContext, chromium } from '@playwright/test';

// In Browser mode every session's WG and WX replies arrive on one shared
// token. Page A shows a MsgBox and its client never answers the OnlyDQ WX, so
// A's WX request is left waiting. Page B then loads a demo that reads a
// property with ⎕WG part-way through building its form. B's reply must reach
// B - a WX waiter once took any reply without checking its WGID or kind,
// which aborted B's load.

const BROWSER_URL = process.env.BROWSER_URL;

test.describe('WG and WX replies on a shared token', () => {
  test.skip(!BROWSER_URL, 'Browser mode only: Multi and desktop use per-session tokens');

  let browser: Browser;
  const contexts: BrowserContext[] = [];
  const base = (BROWSER_URL ?? '').replace(/\/$/, '');

  test.beforeAll(async () => {
    browser = await chromium.launch();
  });

  test.afterAll(async () => {
    for (const c of contexts) await c.close();
    await browser?.close();
  });

  test("a pending WX does not take another session's WG reply", async () => {
    // Page A: drop the client's WX replies and note when OnlyDQ is requested
    const ctxA = await browser.newContext();
    contexts.push(ctxA);
    let onlyDQ!: () => void;
    const onlyDQSeen = new Promise<void>((r) => (onlyDQ = r));
    await ctxA.routeWebSocket(/.*/, (ws) => {
      const server = ws.connectToServer();
      ws.onMessage((m) => {
        if (typeof m === 'string' && m.startsWith('{"WX"')) return;
        server.send(m);
      });
      server.onMessage((m) => {
        if (typeof m === 'string' && m.includes('"OnlyDQ"')) onlyDQ();
        ws.send(m);
      });
    });
    const pageA = await ctxA.newPage();
    await pageA.goto(`${base}/?Demo=MsgBox`, { waitUntil: 'domcontentloaded' });
    await pageA.locator('#F1\\.GO').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.locator('#F1\\.GO').click();
    await onlyDQSeen;

    // A's OnlyDQ now waits 3s. DemoListView reads F1.SPLIT's Posn with ⎕WG
    // and only then creates F1.RIGHT.BOT.TABLE.
    const ctxB = await browser.newContext();
    contexts.push(ctxB);
    const pageB = await ctxB.newPage();
    await pageB.goto(`${base}/?Demo=ListView`, { waitUntil: 'domcontentloaded' });
    await expect(pageB.locator('#F1\\.RIGHT\\.BOT\\.TABLE')).toBeVisible({ timeout: 2500 });
  });
});
