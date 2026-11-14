import { useEffect } from "react";
import type { ReactNode } from "react";

/**
 * Motion on scroll. It only adds classes. `.motion` itself is set before first paint by the head script in
 * `layouts/Base.astro`, and only when the reader allows motion; with no JS, or with reduced motion, it is never set,
 * so every drawing shows its finished state. `data-motion-ready` tells that script the app has hydrated.
 *
 * - `[data-lit]` (the developer page) gets `.lit` while it is in view, and loses it again.
 * - `[data-play]` (the landing page) gets `.played` the first time it comes into view, and keeps it: its
 *   animation plays once and ends in the finished state, which is also its base style.
 */
export function Motion(): ReactNode {
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return undefined;
    document.documentElement.dataset.motionReady = "";
    const seen = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("lit", entry.isIntersecting);
        }
      },
      { rootMargin: "-20% 0px -20% 0px" },
    );
    for (const element of document.querySelectorAll("[data-lit]")) seen.observe(element);
    const once = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("played");
          once.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    for (const element of document.querySelectorAll("[data-play]")) once.observe(element);
    return () => {
      seen.disconnect();
      once.disconnect();
    };
  }, []);
  return null;
}
