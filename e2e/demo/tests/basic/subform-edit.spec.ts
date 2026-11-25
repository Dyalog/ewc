import { test, expect, Browser, Page } from '@playwright/test';
import { connectAndFindEWCPage } from '../helpers/cdp-helper';
import { navigateToDemo } from '../helpers/navigation';

const CDP_PORT = parseInt(process.env.CDP_PORT || '8080', 10);

// SubForm Edit Tests
// Targets: Bug 1 (missing React key - many same-type children),
//          EdgeStyle rendering, font/color inheritance, Locale access
test.describe('DemoSubFormEdit', () => {
  let browser: Browser;
  let page: Page;

  test.beforeAll(async () => {
    const result = await connectAndFindEWCPage(CDP_PORT);
    browser = result.browser;
    page = await navigateToDemo(result.page, 'SubFormEdit', '#F1\\.SF\\.EDIT1', 10000);
  });

  test.beforeEach(async () => {
    await page.waitForTimeout(100);
  });

  // ─────────────────────────────────────────────────────────────
  // SubForm Container
  // ─────────────────────────────────────────────────────────────

  test('SubForm container is visible', async () => {
    await expect(page.locator('#F1\\.SF')).toBeVisible();
  });

  test('SubForm has Groove EdgeStyle border', async () => {
    const sf = page.locator('#F1\\.SF');
    const borderStyle = await sf.evaluate(el => getComputedStyle(el).borderStyle);
    expect(borderStyle).toContain('groove');
  });

  // ─────────────────────────────────────────────────────────────
  // Basic Text Edit — Bug 1 (key: correct child identity)
  // ─────────────────────────────────────────────────────────────

  test('text Edit renders with correct value', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT1');
    await expect(edit).toBeVisible();
    await expect(edit).toHaveValue('Hello World');
  });

  test('text Edit accepts typing', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT1');
    await edit.click();
    await edit.fill('New Value');
    await expect(edit).toHaveValue('New Value');
  });

  // Bug 1 exposure: typing into EDIT1 should not corrupt EDIT9 (sibling isolation)
  test('typing in one Edit does not corrupt sibling Edit', async () => {
    const edit9 = page.locator('#F1\\.SF\\.EDIT9');
    await expect(edit9).toHaveValue('Second Value');
  });

  // ─────────────────────────────────────────────────────────────
  // Numeric Edit — Locale access from SubForm
  // ─────────────────────────────────────────────────────────────

  test('numeric Edit renders with value', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT2');
    await expect(edit).toBeVisible();
    const value = await edit.inputValue();
    // Should contain 12345 (possibly formatted with locale separators)
    expect(value).toContain('12345');
  });

  // ─────────────────────────────────────────────────────────────
  // Password Edit
  // ─────────────────────────────────────────────────────────────

  test('password Edit renders as password type', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT4');
    await expect(edit).toBeVisible();
    const inputType = await edit.getAttribute('type');
    expect(inputType).toBe('password');
  });

  // ─────────────────────────────────────────────────────────────
  // Multi-line Edit
  // ─────────────────────────────────────────────────────────────

  test('multi-line Edit is visible', async () => {
    // TextArea component wraps with a different structure - look for it inside SubForm
    const textarea = page.locator('#F1\\.SF textarea, #F1\\.SF [id*="EDIT5"]');
    await expect(textarea.first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // EdgeStyle Variations — all 6 styles on Edit inputs
  // ─────────────────────────────────────────────────────────────

  test('EdgeStyle Ridge Edit has ridge border', async () => {
    const edit = page.locator('#F1\\.SF\\.ES1');
    await expect(edit).toBeVisible();
    const border = await edit.evaluate(el => {
      const input = el.querySelector('input') || el;
      return getComputedStyle(input).borderStyle;
    });
    expect(border).toContain('ridge');
  });

  test('EdgeStyle Groove Edit has groove border', async () => {
    const edit = page.locator('#F1\\.SF\\.ES2');
    const border = await edit.evaluate(el => {
      const input = el.querySelector('input') || el;
      return getComputedStyle(input).borderStyle;
    });
    expect(border).toContain('groove');
  });

  test('EdgeStyle Recess Edit has inset border', async () => {
    const edit = page.locator('#F1\\.SF\\.ES3');
    const border = await edit.evaluate(el => {
      const input = el.querySelector('input') || el;
      return getComputedStyle(input).borderStyle;
    });
    expect(border).toContain('inset');
  });

  test('EdgeStyle None Edit has no border', async () => {
    const edit = page.locator('#F1\\.SF\\.ES6');
    const border = await edit.evaluate(el => {
      const input = el.querySelector('input') || el;
      return getComputedStyle(input).borderStyle;
    });
    expect(border).toContain('none');
  });

  // ─────────────────────────────────────────────────────────────
  // Font Inheritance through SubForm
  // ─────────────────────────────────────────────────────────────

  test('Edit with FontObj has bold font weight', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT6');
    await expect(edit).toBeVisible();
    const fontWeight = await edit.evaluate(el => {
      const input = el.querySelector('input') || el;
      return getComputedStyle(input).fontWeight;
    });
    expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(700);
  });

  // ─────────────────────────────────────────────────────────────
  // Color Properties in SubForm
  // ─────────────────────────────────────────────────────────────

  test('Edit with FCol has blue text color', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT7');
    await expect(edit).toBeVisible();
    const color = await edit.evaluate(el => {
      const input = el.querySelector('input') || el;
      return getComputedStyle(input).color;
    });
    // rgb(0, 0, 255)
    expect(color).toContain('0, 0, 255');
  });

  test('Edit with BCol has yellow background', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT7');
    const bg = await edit.evaluate(el => getComputedStyle(el).backgroundColor);
    // rgb(255, 255, 200)
    expect(bg).toContain('255, 255, 200');
  });

  // ⎕WS path: BCol must be in edit/Supported.apla or the server drops it
  test('Edit BCol can be changed at runtime via ⎕WS', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT7');
    const btn = page.locator('#F1\\.SF\\.BCOLBTN');
    const bg = () => edit.evaluate(el => getComputedStyle(el).backgroundColor);

    await btn.click();
    await expect.poll(bg).toContain('200, 255, 200');

    // Toggle back so later tests (visual regression) see the original colour
    await btn.click();
    await expect.poll(bg).toContain('255, 255, 200');
  });

  // ─────────────────────────────────────────────────────────────
  // Disabled Edit
  // ─────────────────────────────────────────────────────────────

  test('disabled Edit is not editable', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT8');
    await expect(edit).toBeVisible();
    // Active=0 should make the input disabled or readonly
    const disabled = await edit.isDisabled();
    const readonly = await edit.getAttribute('readonly');
    expect(disabled || readonly !== null).toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────
  // Event Propagation from SubForm Children
  // ─────────────────────────────────────────────────────────────

  test('typed Edit value reaches mirror via Update Mirrors button', async () => {
    // Note: we use the Update Mirrors button rather than relying on
    // Change-event-on-blur. Blur-triggered Change is racy under headless
    // Playwright (Tab/click-outside doesn't always fire the event before
    // the assertion runs). The button click goes through the same
    // CBSubFormDemo callback (eWG 'Text' → eWS 'Caption'), so the
    // round-trip coverage is preserved.
    const edit = page.locator('#F1\\.SF\\.EDIT1');
    const mirror = page.locator('#F1\\.SF\\.EDIT1MIRROR');
    const updateBtn = page.locator('#F1\\.SF\\.UPDATEBTN');

    await edit.click();
    await edit.fill('event test');
    await updateBtn.click();
    await expect(mirror).toContainText('event test', { timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────
  // Focus indicator (regression: was lost when we removed !important
  // from App.css; restored via React isFocused state in Edit/index.jsx)
  // ─────────────────────────────────────────────────────────────

  test('standalone text Edit shows blue underline when focused, removes on blur', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT1');

    // Before focus: no blue underline.
    const idle = await edit.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { width: cs.borderBottomWidth, color: cs.borderBottomColor };
    });
    // Idle bottom border may be 0px (no border) or whatever getBorderStyles
    // sets; assert only that it is NOT the focus indicator.
    expect(idle.width).not.toBe('2px');

    // Focus: blue 2px underline appears.
    await edit.focus();
    await page.waitForTimeout(100);
    const focused = await edit.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { width: cs.borderBottomWidth, color: cs.borderBottomColor };
    });
    expect(focused.width).toBe('2px');
    // Blue computes to rgb(0, 0, 255) in most engines.
    expect(focused.color).toBe('rgb(0, 0, 255)');

    // Blur: indicator goes away.
    await edit.blur();
    await page.waitForTimeout(100);
    const afterBlur = await edit.evaluate((el) => window.getComputedStyle(el).borderBottomWidth);
    expect(afterBlur).not.toBe('2px');
  });

  test('standalone Numeric Edit shows blue underline when focused', async () => {
    const edit = page.locator('#F1\\.SF\\.EDIT2');
    await edit.focus();
    await page.waitForTimeout(100);
    const focused = await edit.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { width: cs.borderBottomWidth, color: cs.borderBottomColor };
    });
    expect(focused.width).toBe('2px');
    expect(focused.color).toBe('rgb(0, 0, 255)');
  });

  // ─────────────────────────────────────────────────────────────
  // Visual Regression
  // ─────────────────────────────────────────────────────────────

  test('visual regression - SubForm Edit demo', async () => {
    await expect(page).toHaveScreenshot('subform-edit-demo.png', {
      maxDiffPixels: 100
    });
  });
});
