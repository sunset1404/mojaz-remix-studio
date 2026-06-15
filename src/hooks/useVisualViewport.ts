import { useEffect, useState } from 'react';

/**
 * Tracks the visual viewport (height + keyboard offset on mobile).
 * keyboardHeight = window.innerHeight - visualViewport.height when keyboard is open.
 */
export function useVisualViewport() {
  const [state, setState] = useState(() => ({
    height: typeof window !== 'undefined' ? (window.visualViewport?.height ?? window.innerHeight) : 0,
    keyboardHeight: 0,
  }));

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const h = vv.height;
      const kb = Math.max(0, window.innerHeight - h - vv.offsetTop);
      setState({ height: h, keyboardHeight: kb });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return state;
}
