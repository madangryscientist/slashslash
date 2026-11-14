import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Frame } from "#/components/evidence";
import { Section } from "#/components/section";

/** The prerendered text is the final number. This only replays the count when it scrolls into view. */
function CountUp({ to }: { to: number }): ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return undefined;
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        seen.disconnect();
        const started = performance.now();
        const tick = (now: number) => {
          const done = Math.min((now - started) / 1100, 1);
          element.textContent = Math.round(to * done * (2 - done)).toLocaleString("en-US");
          if (done < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 1 },
    );
    seen.observe(element);
    return () => seen.disconnect();
  }, [to]);
  return (
    <span ref={ref} className="count">
      {to.toLocaleString("en-US")}
    </span>
  );
}

/**
 * Each combination is a cell, numbered by its on/off bits. The lit cells are the true eleven: all flags
 * off (cell 0) and each flag alone (cells 1, 2, 4 ... 512).
 */
const SINGLE_FLAG_RUNS = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512] as const;

function CombinationGrid(): ReactNode {
  return (
    <svg
      className="combos"
      viewBox="0 0 320 320"
      role="img"
      aria-label="A grid of 1,024 cells, one for each on and off combination of 10 flags. Only 11 cells are lit: all flags off, and each flag on alone."
    >
      <defs>
        <pattern id="combo-cell" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect className="combo-off" x="1" y="1" width="8" height="8" />
        </pattern>
      </defs>
      <rect width="320" height="320" fill="url(#combo-cell)" />
      {SINGLE_FLAG_RUNS.map((cell, i) => (
        <rect
          key={cell}
          className="combo-on"
          x={(cell % 32) * 10 + 1}
          y={Math.floor(cell / 32) * 10 + 1}
          width="8"
          height="8"
          style={{ animationDelay: `${i * 70}ms` }}
        />
      ))}
    </svg>
  );
}

export function Flags(): ReactNode {
  return (
    <Section
      id="flags"
      hunk="the effect of one flag"
      title="What does turning this flag on do?"
      lead="With all four built and connected, the answer could be a short note per flag."
    >
      <Frame kind="made-up" tag="Made up: no tool produces this today" className="flag-frame">
        <div className="diff">
          <div className="diff-at">@@ flag new-checkout: off -&gt; on @@</div>
          <div className="diff-row" data-sign="~">
            <span className="diff-sign">~</span>
            <span className="diff-kind">page</span>
            <span className="diff-key">/checkout</span>
            <span className="diff-val">looks different</span>
          </div>
          <div className="diff-row" data-sign="+">
            <span className="diff-sign">+</span>
            <span className="diff-kind">size</span>
            <span className="diff-key">bundle</span>
            <span className="diff-val">the code behind the flag adds to it</span>
          </div>
          <div className="diff-row" data-sign="!">
            <span className="diff-sign">!</span>
            <span className="diff-kind">test</span>
            <span className="diff-key">checkout</span>
            <span className="diff-val">fails only with the flag on</span>
          </div>
        </div>
      </Frame>

      <div className="hard" data-lit>
        <div>
          <h3 className="hard-title">The combination problem</h3>
          <p className="stat">
            <CountUp to={1024} />
            <span className="stat-text">on and off combinations of 10 flags, too many to run.</span>
          </p>
          <p className="stat stat-on">
            <CountUp to={11} />
            <span className="stat-text">
              runs measure each flag alone against a baseline, which misses what goes wrong only when flags interact.
            </span>
          </p>
        </div>
        <CombinationGrid />
      </div>

      <div className="catch">
        <span className="catch-sign mono" aria-hidden="true">
          !
        </span>
        <p>
          <strong>A runtime flag usually ships both versions of the code.</strong> Builds with the flag on
          and off can be the same size, so what can be measured is the code behind the flag.
        </p>
      </div>
    </Section>
  );
}
