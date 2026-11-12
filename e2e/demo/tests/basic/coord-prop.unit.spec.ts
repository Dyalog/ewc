import { test, expect } from '@playwright/test';
import { isPropCoord, coordLen, toPct } from '../../../../client/src/utils/coord';

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
});
