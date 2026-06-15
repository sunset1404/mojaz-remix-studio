/**
 * Global keyboard handler.
 * - Exposes CSS var `--keyboard-inset` on <html> = on-screen keyboard height in px.
 * - Adds `data-kb-open` attribute on <html> when keyboard is open.
 * - Auto-scrolls focused inputs/textareas into view.
 *
 * Used app-wide so any sticky bar / modal / form can react via:
 *   padding-bottom: var(--keyboard-inset);
 *   bottom: calc(<x> + var(--keyboard-inset));
 */
export function initKeyboardInset() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--keyboard-inset', '0px');

  const vv = window.visualViewport;
  if (!vv) return;

  const update = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    root.style.setProperty('--keyboard-inset', `${Math.round(kb)}px`);
    if (kb > 80) root.setAttribute('data-kb-open', 'true');
    else root.removeAttribute('data-kb-open');
  };

  update();
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);

  // Auto-scroll focused field into view above the keyboard
  const isEditable = (el: Element | null): el is HTMLElement => {
    if (!el) return false;
    const tag = el.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      (el as HTMLElement).isContentEditable
    );
  };

  document.addEventListener(
    'focusin',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!isEditable(target)) return;
      // Wait for keyboard to actually open & viewport to resize
      setTimeout(() => {
        try {
          target!.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch {
          target!.scrollIntoView();
        }
      }, 250);
    },
    true,
  );
}
