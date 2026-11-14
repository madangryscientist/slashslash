import { SCHEMES } from "#ps/schemes";

/** The kit's storage key (colourScheme.js in @hackcove/ui-react), which its head script reads. */
const STORAGE_KEY = "hackcove:colour-scheme";

/**
 * The header's theme toggle. The kit's ColourSchemeToggle is rendered to static HTML here, with no
 * React on the page, so this does what its click handler does (applyColourScheme, then
 * storeColourScheme): switch <html> to the other scheme and remember it. The icon and the button's
 * name follow the class on <html> by the toggle's own CSS. Written out rather than imported: the kit
 * exports only its index, and importing that pulls the shared chunk the slashslash islands use, React
 * included, into a page that hydrates nothing.
 */
export function wireThemeToggle(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-testid="theme-toggle"]')) {
    button.addEventListener("click", () => {
      const root = document.documentElement;
      const next = root.classList.contains(SCHEMES.dark) ? "light" : "dark";
      root.classList.remove(SCHEMES[next === "dark" ? "light" : "dark"]);
      root.classList.add(SCHEMES[next]);
      root.style.colorScheme = next;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage blocked (private mode): the page still switches for this visit.
      }
    });
  }
}
