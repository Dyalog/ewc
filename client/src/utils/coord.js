// Coord 'Prop': Posn/Size are percentages of the parent's interior (for a
// top-level Form, of the screen - the viewport in a browser). The server
// resolves 'Inherit', so Properties.Coord is 'Prop' whenever it applies.
export const isPropCoord = (Properties) =>
  typeof Properties?.Coord === 'string' && Properties.Coord.toLowerCase() === 'prop';

// A Posn/Size number as a CSS length: px, or % of the containing block for 'Prop'
export const coordLen = (Properties, v) =>
  isPropCoord(Properties) && typeof v === 'number' ? `${v}%` : v;

// A measured px length as a 'Prop' percentage of `of` px, to 4dp
export const toPct = (px, of) => Math.round((1e6 * px) / of) / 1e4;
