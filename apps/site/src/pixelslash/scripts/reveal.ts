/**
 * Marks each `.home-reveal` on the home page as it scrolls into view: PixelSlash's useReveal hook,
 * run as a page script, since Astro renders the page to static HTML and runs no React effects. What
 * is already on screen is marked before `data-motion` turns the hiding on (home.css), so nothing
 * blinks out; with no script nothing is hidden.
 */
export function wireReveal(): void {
  const element = document.querySelector<HTMLElement>(".home");
  if (!element) return;
  const targets = [...element.querySelectorAll(".home-reveal")];
  for (const target of targets)
    if (target.getBoundingClientRect().top < window.innerHeight) target.classList.add("is-in");
  element.dataset["motion"] = "";
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  for (const target of targets) if (!target.classList.contains("is-in")) observer.observe(target);
}
