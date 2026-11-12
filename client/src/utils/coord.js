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

// Graphics in Coord 'Prop': Points and Size are (ys xs) rows - one pair per
// shape, or a list of pairs (Poly) - as % of the parent's interior; Radius is
// along the x-axis. SVG needs px, so scale them by the parent's client box.
const isNums = (v) => typeof v === 'number' || (Array.isArray(v) && v.every((n) => typeof n === 'number'));
const scaleBy = (v, k) => (Array.isArray(v) ? v.map((n) => (n * k) / 100) : (v * k) / 100);
const scaleRows = (v, ph, pw) => {
  if (!Array.isArray(v)) return v;
  if (v.length === 2 && isNums(v[0]) && isNums(v[1])) return [scaleBy(v[0], ph), scaleBy(v[1], pw)];
  return v.map((p) => scaleRows(p, ph, pw));
};

export const scaleGraphics = (Properties, [ph, pw]) => {
  if (!isPropCoord(Properties) || !ph || !pw) return Properties;
  const out = { ...Properties };
  if (out.Points !== undefined) out.Points = scaleRows(out.Points, ph, pw);
  if (out.Size !== undefined) out.Size = scaleRows(out.Size, ph, pw);
  if (isNums(out.Radius)) out.Radius = scaleBy(out.Radius, pw);
  return out;
};
