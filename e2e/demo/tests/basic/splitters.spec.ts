import { test, expect, Browser, Page } from '@playwright/test';
import { connectAndFindEWCPage } from '../helpers/cdp-helper';
import { navigateToDemo } from '../helpers/navigation';
import { openInjectablePage } from '../helpers/ws-inject';

const CDP_PORT = parseInt(process.env.CDP_PORT || '8080', 10);
const INDICATOR = '#F1\\.LEFT\\.COLORS';

// The Splitter objects themselves on DemoSplitters (pane Attach behaviour is
// covered by splitters-attach.spec.ts):
//   F1.SPLIT        vertical,   Posn 0 200, divides F1.LEFT | F1.RIGHT
//   F1.RIGHT.SPLIT  horizontal, Posn 300 0, divides F1.RIGHT.TOP / F1.RIGHT.BOT
// Both raise EndSplit to CBUpdateSplit, which writes "X:… Y:…" (the event
// Info) to F1.RIGHT.TOP.Average, followed by "*** …" for any mismatch its
// eWG Size/Posn checks find between the splitter and its panes.
const V = 'F1.SPLIT';
const H = 'F1.RIGHT.SPLIT';
const LABEL = '#F1\\.RIGHT\\.TOP\\.Average';
const V_HOME = 200;
const H_HOME = 300;

const sel = (id: string) => `#${id.replace(/\./g, '\\.')}`;
const near = (a: number, b: number, tol = 2) => Math.abs(a - b) <= tol;

// offsetLeft/Top/Width/Height: the element's own CSS geometry within its
// offset parent, so the Form's border does not enter into it.
const geom = (page: Page, id: string) =>
  page.evaluate((i) => {
    const e = document.getElementById(i) as HTMLElement;
    return { left: e.offsetLeft, top: e.offsetTop, width: e.offsetWidth, height: e.offsetHeight };
  }, id);

// Drag a splitter by (dx, dy) with the mouse so its own handlers run.
const dragBy = async (page: Page, id: string, dx: number, dy: number) => {
  // The 800px form is taller than the default viewport: a bar near the bottom
  // must be scrolled to before the mouse can reach it
  await page.locator(sel(id)).scrollIntoViewIfNeeded();
  const b = await page.locator(sel(id)).boundingBox();
  if (!b) throw new Error(`no bounding box for #${id}`);
  const cx = b.x + b.width / 2;
  const cy = b.y + Math.min(b.height / 2, 50);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);
};

// Wait until CBUpdateSplit has reported this splitter's current position.
// It eWGs the client several times before writing the label, so leaving the
// page mid-callback would strand those WGs and stall the server.
const endSplitDone = async (page: Page, id: string) => {
  const g = await geom(page, id);
  const info = id === V ? `X:0\\s+Y:${g.left}` : `X:${g.top}\\s+Y:0`;
  await expect(page.locator(LABEL)).toHaveText(new RegExp(`^\\s*${info}\\b`));
};

// Drag a vertical splitter to left=target, or a horizontal one to top=target.
const dragTo = async (page: Page, id: string, target: number) => {
  const g = await geom(page, id);
  if (id === V) await dragBy(page, id, target - g.left, 0);
  else await dragBy(page, id, 0, target - g.top);
};

test.describe('DemoSplitters — Splitter', () => {
  let page: Page;

  test.beforeAll(async () => {
    const result = await connectAndFindEWCPage(CDP_PORT);
    page = await navigateToDemo(result.page, 'Splitters', INDICATOR, 10000);
  });

  // Every test starts from the authored positions
  test.afterEach(async () => {
    await dragTo(page, V, V_HOME);
    await dragTo(page, H, H_HOME);
  });

  // The last afterEach drag ends on the horizontal splitter; let its EndSplit
  // callback finish before the next spec reloads the page
  test.afterAll(async () => {
    await endSplitDone(page, H);
  });

  test('splitters start at their authored Posn', async () => {
    expect((await geom(page, V)).left).toBe(V_HOME);
    expect((await geom(page, H)).top).toBe(H_HOME);
  });

  test('dragging the vertical splitter moves it and resizes both panes', async () => {
    await dragTo(page, V, 280);

    const split = await geom(page, V);
    const left = await geom(page, 'F1.LEFT');
    const right = await geom(page, 'F1.RIGHT');
    const form = await geom(page, 'F1');

    expect(near(split.left, 280)).toBeTruthy();
    // Left pane ends where the splitter starts...
    expect(near(left.width, split.left)).toBeTruthy();
    // ...the right pane starts just after it and runs to the Form's right edge
    expect(near(right.left, split.left + split.width)).toBeTruthy();
    expect(near(right.left + right.width, form.width, 4)).toBeTruthy();
  });

  test('dragging the horizontal splitter moves it and resizes both panes', async () => {
    await dragTo(page, H, 200);

    const split = await geom(page, H);
    const top = await geom(page, 'F1.RIGHT.TOP');
    const bot = await geom(page, 'F1.RIGHT.BOT');
    const parent = await geom(page, 'F1.RIGHT');

    expect(near(split.top, 200)).toBeTruthy();
    expect(near(top.height, split.top)).toBeTruthy();
    expect(near(bot.top, split.top + split.height)).toBeTruthy();
    expect(near(bot.top + bot.height, parent.height, 4)).toBeTruthy();
  });

  test('EndSplit reports the vertical splitter position to APL', async () => {
    await dragTo(page, V, 260);
    const { left } = await geom(page, V);
    // Info is [0, left] for a vertical splitter (APL ⍕ spaces the fields)
    await expect(page.locator(LABEL)).toHaveText(new RegExp(`^\\s*X:0\\s+Y:${left}\\b`));
  });

  test('EndSplit reports the horizontal splitter position to APL', async () => {
    await dragTo(page, H, 220);
    const { top } = await geom(page, H);
    // Info is [top, 0] for a horizontal splitter
    await expect(page.locator(LABEL)).toHaveText(new RegExp(`^\\s*X:${top}\\s+Y:0\\b`));
  });

  test('dragging past the left edge clamps the splitter at 0', async () => {
    await dragBy(page, V, -2000, 0);

    const split = await geom(page, V);
    const left = await geom(page, 'F1.LEFT');
    const right = await geom(page, 'F1.RIGHT');
    const form = await geom(page, 'F1');

    expect(split.left).toBe(0);
    expect(left.width).toBe(0);
    expect(near(right.left + right.width, form.width, 4)).toBeTruthy();
  });

  test('resizing the Form moves the splitter proportionally', async () => {
    const resize = async (depth: number, width: number) => {
      await page.locator(sel('F1.RIGHT.TOP.DEPTH')).fill(String(depth));
      await page.locator(sel('F1.RIGHT.TOP.WIDTH')).fill(String(width));
      await page.locator(sel('F1.RIGHT.TOP.RESIZE')).click();
      await expect.poll(async () => (await geom(page, 'F1')).width, { timeout: 5000 }).toBeLessThan(width + 10);
      await page.waitForTimeout(800);
    };

    try {
      await resize(700, 600);
      const split = await geom(page, V);
      // 200 of an 800-wide form becomes ~150 of a 600-wide one
      expect(near(split.left, (V_HOME * 600) / 800, 3)).toBeTruthy();
      expect(near((await geom(page, 'F1.LEFT')).width, split.left)).toBeTruthy();
    } finally {
      await resize(800, 800);
    }
    expect(near((await geom(page, V)).left, V_HOME, 3)).toBeTruthy();
  });

  // The panes are sized from the parent's content box. Measured with its 1px
  // border, CBUpdateSplit's eWG checks found 1-2px mismatches
  // (e.g. "right width (517) ≠ form-split pos (515)").
  test('EndSplit callback finds the splitter and panes consistent via eWG', async () => {
    await dragTo(page, V, 280);
    await expect(page.locator(LABEL)).toHaveText(/^\s*X:0\s+Y:\d+/);
    await expect(page.locator(LABEL)).not.toContainText('***');
  });

  // The clamp keeps the whole bar inside the parent's content box; measured
  // against the bordered box it slid under the clipped edge and was lost.
  test('a splitter dragged against the right edge stays visible and can be dragged back', async () => {
    await dragBy(page, V, 3000, 0);
    const split = await geom(page, V);
    const form = await page.evaluate(() => document.getElementById('F1')!.clientWidth);
    expect(split.left + split.width).toBeLessThanOrEqual(form);

    await dragTo(page, V, V_HOME);
    expect(near((await geom(page, V)).left, V_HOME)).toBeTruthy();
  });

  test('a splitter dragged against the bottom edge stays visible and can be dragged back', async () => {
    await dragBy(page, H, 0, 3000);
    const split = await geom(page, H);
    const parent = await page.evaluate(() => document.getElementById('F1.RIGHT')!.clientHeight);
    expect(split.top + split.height).toBeLessThanOrEqual(parent);

    await dragTo(page, H, H_HOME);
    expect(near((await geom(page, H)).top, H_HOME)).toBeTruthy();
  });

});

// No demo callback sets a Splitter's Posn at runtime, so inject the WS frame.
// A describe of its own, like expunge-overlap.spec.ts: the injected page's
// connection takes over the demo session, so the shared page must not be used
// again until the next spec reloads it.
test.describe('DemoSplitters — Splitter Posn from the server', () => {
  let browser: Browser;

  test.beforeAll(async () => {
    const result = await connectAndFindEWCPage(CDP_PORT);
    browser = result.browser;
  });

  test('a Posn set by the server moves the splitter, and dragging continues from there', async () => {
    const injected = await openInjectablePage(browser, 'Splitters', INDICATOR, 15000);
    const { page: p, send } = injected;
    try {
      await send({ WS: { ID: V, Properties: { Posn: [0, 260] } } });
      await expect.poll(async () => (await geom(p, V)).left).toBe(260);

      await send({ WS: { ID: H, Properties: { Posn: [180, 0] } } });
      await expect.poll(async () => (await geom(p, H)).top).toBe(180);

      await dragBy(p, V, 40, 0);
      expect(near((await geom(p, V)).left, 300)).toBeTruthy();
      await endSplitDone(p, V);
    } finally {
      await injected.dispose();
    }
  });
});
