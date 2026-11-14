const SCROLLERS = 'main [class*="overflow-x-auto"]';
const FOCUSABLE = "a[href], button, input, select, textarea, summary, [tabindex]";

/**
 * A code block or table wider than its box scrolls sideways, and a keyboard reader can only scroll
 * what can take focus. The UI kit's scrollers cannot, so each one that overflows and holds nothing
 * focusable gets a tab stop. Only those: a block that fits stays out of the tab order. This runs
 * again when the width changes. (The PixelSlash repo's useKeyboardScrollers, as a plain script: these
 * pages are static, so there is no React on the page to run a hook.)
 */
export function markKeyboardScrollers(): void {
  const mark = (): void => {
    for (const scroller of document.querySelectorAll<HTMLElement>(SCROLLERS)) {
      if (scroller.scrollWidth > scroller.clientWidth) {
        if (scroller.querySelector(FOCUSABLE) === null) scroller.tabIndex = 0;
      } else {
        scroller.removeAttribute("tabindex");
      }
    }
  };
  mark();
  window.addEventListener("resize", mark);
}
