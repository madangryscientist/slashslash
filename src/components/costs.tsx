import type { ReactNode } from "react";
import { Section } from "#/components/section";
import { COSTS } from "#/content/landing";

/** The four arrowheads, clockwise, at the ring's top, right, bottom and left. */
const ARROWS = [
  "M98 23.3l6 6-6 6",
  "M164.7 96l6 6 6-6",
  "M102 164.7l-6 6 6 6",
  "M23.3 104l6-6 6 6",
];

/** What it costs: a loop that runs once, no numbers. */
export function Costs(): ReactNode {
  return (
    <Section id="costs" title={COSTS.title}>
      <div className="costs">
        <p className="sec-body">{COSTS.text}</p>
        <div className="loop" data-play="">
          <svg className="loop-ring" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="70.7" pathLength={1} transform="rotate(-135 100 100)" />
            {ARROWS.map((d, i) => (
              <path className="loop-arrow" d={d} key={d} style={{ "--i": i }} />
            ))}
          </svg>
          <ol className="loop-steps" aria-label="The loop each surprise starts">
            {COSTS.loop.map((step, i) => (
              <li key={step} style={{ "--i": i }}>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
