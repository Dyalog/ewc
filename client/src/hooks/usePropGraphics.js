import { useEffect, useState } from 'react';
import useResizeObserver from './useResizeObserver';
import { parentId, isPropCoord } from '../utils';
import { scaleGraphics } from '../utils/coord';

// Properties of a graphics object with Coord 'Prop' Points/Size/Radius turned
// into px of its parent's interior, kept current as the parent resizes.
// Anything else is returned unchanged.
const usePropGraphics = (data) => {
  const prop = isPropCoord(data?.Properties);
  const pid = prop && data?.ID ? parentId(data.ID) : null;
  // The parent isn't in the DOM on the first render: look again once mounted
  const [, remount] = useState(0);
  useEffect(() => {
    if (pid) remount((n) => n + 1);
  }, [pid]);
  const el = pid ? document.getElementById(pid) : null;
  useResizeObserver(el, { box: 'content' }); // re-render when the parent resizes
  if (!el) return data?.Properties;
  return scaleGraphics(data?.Properties, [el.clientHeight, el.clientWidth]);
};

export default usePropGraphics;
