import type { ReactNode } from "react";
import { TODAY } from "#content/landing";
import { STEPS_TODAY } from "#next/content/story";

/*
 * The five steps a change takes today, drawn as a pipeline down a rail, moved from the live app and
 * redrawn on the theme's variables (pipeline.css). The change card ends at the last step, where the
 * customer meets it. The story's words sit beside it in the kit's Steps; the drawing
 * keeps its own text equivalents (the list's name and each step's label). With no script or reduced
 * motion it is the finished drawing; with motion each step plays once as it comes into view.
 */

type StepLabel = (typeof STEPS_TODAY.steps)[number]["label"];

const ICONS: Record<StepLabel, ReactNode> = {
  // A speech bubble: someone asks.
  "Asked.": <path d="M4 5h16v11H9l-5 4z" />,
  // A pencil: an agent edits.
  "Made.": <path d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4" />,
  // A stamp: a person approves.
  "Approved.": <path d="M9 3h6v6l3 3v3H6v-3l3-3zM5 20h14" />,
  // A traffic light: the checks give a green or red light.
  "Checked.": (
    <>
      <rect x="8" y="2" width="8" height="20" rx="3" />
      <circle cx="12" cy="7" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="17" r="1.6" />
    </>
  ),
  // A shopfront: it goes live.
  "Live.": <path d="M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18M10 20v-6h4v6" />,
};

/** The change card from the first step, arrived at the last. */
function ChangeCard(): ReactNode {
  return (
    <span className="pipe-card" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6M9 12h6" />
      </svg>
      {TODAY.card}
    </span>
  );
}

function Customer(): ReactNode {
  return (
    <span className="pipe-customer">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1-5 4-7 8-7s7 2 8 7" />
      </svg>
      {TODAY.customer}
    </span>
  );
}

export function Pipeline(): ReactNode {
  const last = STEPS_TODAY.steps.length - 1;
  return (
    <div className="pipe" data-testid="pipeline">
      <ol className="pipe-steps" aria-label={STEPS_TODAY.title}>
        {STEPS_TODAY.steps.map((step, index) => (
          <li className="pipe-step" key={step.label} data-play="">
            <span className="pipe-dot">
              <svg className="pipe-icon" viewBox="0 0 24 24" aria-hidden="true">
                {ICONS[step.label]}
              </svg>
            </span>
            <span className="pipe-label">{step.label.replace(/\.$/, "")}</span>
            {index === last ? (
              <span className="pipe-slot">
                <ChangeCard />
                <Customer />
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
