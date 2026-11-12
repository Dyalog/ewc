import { test, expect } from '@playwright/test';
import { isPropCoord, coordLen, toPct, scaleGraphics } from '../../../../client/src/utils/coord';

test.describe('Coord Prop helpers (unit)', () => {
  test('isPropCoord: only Coord Prop, case-insensitive', () => {
    expect(isPropCoord({ Coord: 'Prop' })).toBe(true);
    expect(isPropCoord({ Coord: 'prop' })).toBe(true);
    expect(isPropCoord({ Coord: 'Pixel' })).toBe(false);
    expect(isPropCoord({ Coord: 'Inherit' })).toBe(false);
    expect(isPropCoord({})).toBe(false);
    expect(isPropCoord(undefined)).toBe(false);
  });

  test('coordLen: % for Prop, px numbers unchanged otherwise', () => {
    expect(coordLen({ Coord: 'Prop' }, 12.5)).toBe('12.5%');
    expect(coordLen({ Coord: 'Prop' }, 0)).toBe('0%');
    expect(coordLen({ Coord: 'Pixel' }, 12.5)).toBe(12.5);
    expect(coordLen({}, 40)).toBe(40);
  });

  test('coordLen: leaves non-numbers alone (e.g. [] meaning "omit")', () => {
    expect(coordLen({ Coord: 'Prop' }, undefined)).toBeUndefined();
    expect(coordLen({ Coord: 'Prop' }, 'auto')).toBe('auto');
  });

  test('toPct: px as % of a length, to 4 decimal places', () => {
    expect(toPct(72, 720)).toBe(10);
    expect(toPct(230.39, 576)).toBe(39.9983);
    expect(toPct(0, 100)).toBe(0);
  });

  test('scaleGraphics: Points/Size rows by parent height and width, Radius by width', () => {
    const box = [200, 400]; // parent interior: h 200, w 400
    // One shape: (ys xs)
    expect(scaleGraphics({ Coord: 'Prop', Points: [[10, 50], [10, 25]], Size: [[50], [25]] }, box))
      .toEqual({ Coord: 'Prop', Points: [[20, 100], [40, 100]], Size: [[100], [100]] });
    // Scalars, and Radius along the x-axis
    expect(scaleGraphics({ Coord: 'Prop', Points: [25, 75], Radius: 10 }, box))
      .toEqual({ Coord: 'Prop', Points: [50, 300], Radius: 40 });
    // Poly: a list of (ys xs) pairs
    expect(scaleGraphics({ Coord: 'Prop', Points: [[[10, 20], [10, 20]], [[50, 60], [50, 60]]] }, box).Points)
      .toEqual([[[20, 40], [40, 80]], [[100, 120], [200, 240]]]);
  });

  test('scaleGraphics: anything not Prop, or no parent size yet, is left alone', () => {
    const px = { Coord: 'Pixel', Points: [10, 20], Radius: 5 };
    expect(scaleGraphics(px, [200, 400])).toBe(px);
    const prop = { Coord: 'Prop', Points: [10, 20] };
    expect(scaleGraphics(prop, [0, 0])).toBe(prop);
  });
});
