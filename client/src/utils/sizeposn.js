function boundingBox(id) {
  const el = document.getElementById(id + ".$CONTAINER") || document.getElementById(id);
  if (el === null) return null;
  return el.getBoundingClientRect();
}

function parentId(id) {
  const parts = id.split('.');
  if (parts.length === 1) return null;
  return parts.slice(0, -1).join('.');
}

import { isPropCoord, toPct as pct } from './coord';

// Coord 'Prop' reports Posn/Size as percentages of the parent's interior, or
// for a top-level Form, of the screen (the viewport in a browser).
const isProp = (coord) => isPropCoord({ Coord: coord });

function propBox(id) {
  const pid = parentId(id);
  if (pid === null) return [window.innerHeight, window.innerWidth];
  const pel = document.getElementById(pid);
  return pel ? [pel.clientHeight, pel.clientWidth] : null;
}

function posn(id, coord) {
  const bb = boundingBox(id);
  if (bb === null) return null;
  const pid = parentId(id);
  if (isProp(coord)) {
    const box = propBox(id);
    if (box === null) return null;
    let [y, x] = [bb.y, bb.x];
    if (pid !== null) { // relative to the parent's padding edge, as CSS % positions are
      const pel = document.getElementById(pid);
      const pbb = pel.getBoundingClientRect();
      y -= pbb.y + pel.clientTop;
      x -= pbb.x + pel.clientLeft;
    }
    return [pct(y, box[0]), pct(x, box[1])];
  }
  if (pid === null) return [bb.y, bb.x];
  const pbb = boundingBox(pid);
  return [bb.y - pbb.y - 1, bb.x - pbb.x - 1];
}

// As per boundingBox, but excludes the border
function size(id, coord) {
  const el =
    document.getElementById(id + ".$CONTAINER") || document.getElementById(id);
  if (el === null) return null;
  if (isProp(coord)) {
    const box = propBox(id);
    if (box === null) return null;
    // A Form's Size is its client area; anything else is its total size
    const [h, w] = parentId(id) === null
      ? [el.clientHeight, el.clientWidth]
      : (({ height, width }) => [height, width])(el.getBoundingClientRect());
    return [pct(h, box[0]), pct(w, box[1])];
  }
  return [el.clientHeight, el.clientWidth];
}

export {size, posn};
