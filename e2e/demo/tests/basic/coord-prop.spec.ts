import { test, expect, Browser, Page } from '@playwright/test';
import { connectAndFindEWCPage } from '../helpers/cdp-helper';
import { navigateToDemo } from '../helpers/navigation';

const CDP_PORT = parseInt(process.env.CDP_PORT || '8080', 10);

// DemoCoordProp (test-apps/demo/DemoCoordProp.aplf). With Coord 'Prop', Posn and
// Size are percentages - of the screen (the browser viewport) for a Form, of the
// parent's interior for everything inside it - and children inherit the Form's
// Coord. F1.INPUT is a Pixel strip holding the demo menu; F1.G.PX is a Pixel
// child of a Prop parent. Report writes what eWG returns (in each object's own
// units) into F1.OUT; Grow resizes the Group with eWS.
//
// Geometry is measured here from the DOM - each element against its parent's
// interior (client) box, or the viewport for the Form - not from EWC's own
// conversion code, so these checks are independent of the implementation.

type Box = { y: number; x: number; h: number; w: number };

const sel = (id: string) => `[id="${id}"]`;

// Element box relative to its parent's interior, in px, plus that interior size.
// For the Form the "parent" is the viewport and its Size is its client area.
const measure = (page: Page, id: string) =>
  page.evaluate((id) => {
    const el = document.getElementById(id)!;
    const r = el.getBoundingClientRect();
    const pid = id.split('.').slice(0, -1).join('.');
    if (!pid) {
      return {
        px: { y: r.y, x: r.x, h: el.clientHeight, w: el.clientWidth },
        parent: { h: window.innerHeight, w: window.innerWidth },
      };
    }
    const p = document.getElementById(pid)!;
    const pr = p.getBoundingClientRect();
    return {
      px: { y: r.y - pr.y - p.clientTop, x: r.x - pr.x - p.clientLeft, h: r.height, w: r.width },
      parent: { h: p.clientHeight, w: p.clientWidth },
    };
  }, id);

const asPct = async (page: Page, id: string): Promise<Box> => {
  const { px, parent } = await measure(page, id);
  return {
    y: (100 * px.y) / parent.h,
    x: (100 * px.x) / parent.w,
    h: (100 * px.h) / parent.h,
    w: (100 * px.w) / parent.w,
  };
};

// Within `tol` percentage points (or px), per component
const expectBox = (actual: Box, expected: number[], tol: number) => {
  const [y, x, h, w] = expected;
  expect(Math.abs(actual.y - y)).toBeLessThanOrEqual(tol);
  expect(Math.abs(actual.x - x)).toBeLessThanOrEqual(tol);
  expect(Math.abs(actual.h - h)).toBeLessThanOrEqual(tol);
  expect(Math.abs(actual.w - w)).toBeLessThanOrEqual(tol);
};

// F1.OUT holds "name=y x h w|..." from eWG (APL ¯ for negatives)
const readReport = async (page: Page) => {
  const text = (await page.locator(sel('F1.OUT')).innerText()).trim();
  const out: Record<string, number[]> = {};
  for (const part of text.split('|')) {
    const [name, nums] = part.split('=');
    out[name] = nums.trim().split(/\s+/).map((n) => Number(n.replace('¯', '-')));
  }
  return out;
};

test.describe('DemoCoordProp - Coord Prop', () => {
  let browser: Browser;
  let page: Page;

  test.beforeAll(async () => {
    const result = await connectAndFindEWCPage(CDP_PORT);
    browser = result.browser;
    page = await navigateToDemo(result.page, 'CoordProp', sel('F1.OUT'), 15000);
  });

  test.beforeEach(async () => {
    await new Promise((r) => setTimeout(r, 100));
  });

  test('a Prop Form is positioned and sized as % of the viewport', async () => {
    expectBox(await asPct(page, 'F1'), [5, 5, 80, 70], 0.3);
  });

  test('children inherit Prop: % of their parent\'s interior', async () => {
    expectBox(await asPct(page, 'F1.G'), [15, 5, 40, 45], 0.3);
    expectBox(await asPct(page, 'F1.SF'), [15, 55, 40, 40], 0.3);
    expectBox(await asPct(page, 'F1.REPORT'), [60, 40, 8, 20], 0.3);
    expectBox(await asPct(page, 'F1.LS'), [60, 5, 25, 30], 0.6);
    // Attached edges don't change where a Prop object starts out
    expectBox(await asPct(page, 'F1.BR'), [88, 80, 6, 15], 0.3);
  });

  test('grandchildren are % of their own parent, not of the Form', async () => {
    expectBox(await asPct(page, 'F1.G.B'), [30, 10, 25, 80], 0.3);
    expectBox(await asPct(page, 'F1.SF.L'), [10, 10, 15, 80], 0.3);
    const edit = await asPct(page, 'F1.SF.E');
    expect(Math.abs(edit.y - 35)).toBeLessThanOrEqual(0.3);
    expect(Math.abs(edit.x - 10)).toBeLessThanOrEqual(0.3);
    // A Combo keeps its natural height, as a native one does; its position is still %
    const combo = await asPct(page, 'F1.SF.C');
    expect(Math.abs(combo.y - 60)).toBeLessThanOrEqual(0.3);
    expect(Math.abs(combo.x - 10)).toBeLessThanOrEqual(0.3);
  });

  test('an explicit Pixel child of a Prop parent is placed in px', async () => {
    const { px } = await measure(page, 'F1.G.PX');
    expectBox(px, [170, 8, 24, 70], 1.5);
  });

  test('an explicit Pixel SubForm in a Prop Form is placed in px', async () => {
    const { px } = await measure(page, 'F1.INPUT');
    expectBox(px, [0, 0, 34, 460], 1);
    await expect(page.locator('[role="combobox"][id$=".MENU"]').first()).toBeVisible();
  });

  test('eWG Posn/Size answer in each object\'s own units', async () => {
    await page.locator(sel('F1.REPORT')).click();
    await expect(page.locator(sel('F1.OUT'))).toContainText('F1.SF.L=', { timeout: 10000 });
    const r = await readReport(page);
    const close = (got: number[], want: number[], tol: number) =>
      want.forEach((v, i) => expect(Math.abs(got[i] - v), `${got} vs ${want}`).toBeLessThanOrEqual(tol));
    close(r['F1'], [5, 5, 80, 70], 0.3);          // Prop Form: % of viewport
    close(r['F1.G'], [15, 5, 40, 45], 0.3);       // Prop, measured live
    close(r['F1.G.B'], [30, 10, 25, 80], 0.3);
    close(r['F1.SF'], [15, 55, 40, 40], 0.3);
    close(r['F1.SF.L'], [10, 10, 15, 80], 0.01);  // static (not a Dynamic property)
    close(r['F1.G.PX'], [170, 8, 24, 70], 2.5);   // Pixel child: px, not %
  });

  test('resizing a Prop parent with eWS moves its Prop children with it', async () => {
    const before = await measure(page, 'F1.G.B');
    await page.locator(sel('F1.GROW')).click();
    await expect
      .poll(async () => (await asPct(page, 'F1.G')).h, { timeout: 10000 })
      .toBeCloseTo(55, 0);
    expectBox(await asPct(page, 'F1.G'), [15, 5, 55, 50], 0.3);
    // Same percentages of a bigger Group: a bigger button
    expectBox(await asPct(page, 'F1.G.B'), [30, 10, 25, 80], 0.3);
    const after = await measure(page, 'F1.G.B');
    expect(after.px.h).toBeGreaterThan(before.px.h + 10);
    expect(after.px.w).toBeGreaterThan(before.px.w + 10);
  });

  test('a viewport resize keeps every Prop object at the same percentages', async () => {
    const original = page.viewportSize()!;
    // With the default AutoConf and no Attach, ⎕WC reconfigures every child in
    // proportion when its parent resizes - a Pixel child too (its px change)
    const pixelBefore = await asPct(page, 'F1.G.PX');
    // F1.BR is Prop with Attach Bottom Right: its gaps to the Form's bottom-right
    // corner, and its size, are fixed in px from then on
    const gaps = async () => {
      const { px, parent } = await measure(page, 'F1.BR');
      return { bottom: parent.h - (px.y + px.h), right: parent.w - (px.x + px.w), h: px.h, w: px.w };
    };
    const pinnedBefore = await gaps();
    try {
      await page.setViewportSize({ width: 1000, height: 600 });
      await expect
        .poll(async () => (await measure(page, 'F1')).px.w, { timeout: 10000 })
        .toBeCloseTo(700, 0);
      expectBox(await asPct(page, 'F1'), [5, 5, 80, 70], 0.3);
      expectBox(await asPct(page, 'F1.G'), [15, 5, 55, 50], 0.3);
      expectBox(await asPct(page, 'F1.G.B'), [30, 10, 25, 80], 0.3);
      expectBox(await asPct(page, 'F1.SF'), [15, 55, 40, 40], 0.3);
      // The Pixel child scaled with its parent: same proportions as before
      const pixelAfter = await asPct(page, 'F1.G.PX');
      expectBox(pixelAfter, [pixelBefore.y, pixelBefore.x, pixelBefore.h, pixelBefore.w], 0.5);
      const pinnedAfter = await gaps();
      for (const k of ['bottom', 'right', 'h', 'w'] as const) {
        expect(Math.abs(pinnedAfter[k] - pinnedBefore[k]), k).toBeLessThanOrEqual(1.5);
      }
    } finally {
      await page.setViewportSize(original);
    }
  });
});
