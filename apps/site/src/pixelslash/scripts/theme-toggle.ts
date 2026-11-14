import { applyColourScheme, storeColourScheme } from "@hackcove/ui-react";
import { SCHEMES } from "#ps/schemes";

/**
 * The header's theme toggle. The kit's ColourSchemeToggle is rendered to static HTML here, with no
 * React on the page, so this does what its click handler would: switch <html> to the other scheme and
 * remember it. The icon and the button's name follow the class on <html> by the toggle's own CSS.
 */
export function wireThemeToggle(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-testid="theme-toggle"]')) {
    button.addEventListener("click", () => {
      const root = document.documentElement;
      const next = root.classList.contains(SCHEMES.dark) ? "light" : "dark";
      applyColourScheme(next, root, SCHEMES);
      storeColourScheme(next);
    });
  }
}
