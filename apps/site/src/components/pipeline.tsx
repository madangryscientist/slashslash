import type { ReactNode } from "react";
import { MISSING, TODAY } from "#/content/landing";
import type { Step } from "#/content/landing";

/**
 * The page's one device: the five steps a change takes, drawn as a pipeline (left to right on a wide
 * screen, top to bottom on a phone). It appears three times, so the reader watches one picture change:
 * today, with the gap marked, and with the report attached.
 *
 * Every variant has the same geometry (node row, band, slot), so the three drawings line up. The base
 * style is the finished state; the start of each animation lives under `.motion` in styles.css.
 */
type PipelineVariant = "today" | "missing" | "adds";

const ICONS: Record<Step["label"], ReactNode> = {
  // A speech bubble: someone asks.
  Asked: <path d="M4 5h16v11H9l-5 4z" />,
  // A pencil: a developer edits.
  Made: <path d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4" />,
  // A stamp: a colleague approves.
  Approved: <path d="M9 3h6v6l3 3v3H6v-3l3-3zM5 20h14" />,
  // A traffic light: the checks give a green or red light.
  Checked: (
    <>
      <rect x="8" y="2" width="8" height="20" rx="3" />
      <circle cx="12" cy="7" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="17" r="1.6" />
    </>
  ),
  // A shopfront: it goes live.
  Live: <path d="M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18M10 20v-6h4v6" />,
};

function Icon({ label }: { label: Step["label"] }): ReactNode {
  return (
    <svg className="pipe-icon" viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[label]}
    </svg>
  );
}

/** The change card from step 1. On the today pipeline it visits each step and stays at the last. */
export function ChangeCard(): ReactNode {
  return (
    <span className="pipe-card" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="pipe-card-icon">
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6M9 12h6" />
      </svg>
      {TODAY.card}
    </span>
  );
}

export function Customer(): ReactNode {
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

export function Pipeline({
  variant,
  label,
  slots,
  attached = [],
  playEach = false,
}: {
  variant: PipelineVariant;
  /** What the drawing shows, for screen readers, since the band and the marks are drawn. */
  label: string;
  /** What goes under each step, by label. */
  slots: Partial<Record<Step["label"], ReactNode>>;
  /** Steps the report card attaches to. */
  attached?: readonly Step["label"][];
  /** Each step plays as it scrolls into view (the today pipeline); otherwise the whole drawing plays. */
  playEach?: boolean;
}): ReactNode {
  return (
    <div className="pipe" data-variant={variant} data-play={playEach ? undefined : ""}>
      <ol className="pipe-steps" aria-label={label}>
        {TODAY.steps.map((step, index) => (
          <li
            className="pipe-step"
            key={step.label}
            data-step={step.label}
            data-attached={attached.includes(step.label) ? "" : undefined}
            data-play={playEach ? "" : undefined}
            style={{ "--i": index }}
          >
            <div className="pipe-node">
              <span className="pipe-dot">
                <Icon label={step.label} />
              </span>
              <span className="pipe-label">{step.label}</span>
            </div>
            <div className="pipe-band" data-band={index < 4 ? "code" : "result"} aria-hidden="true">
              {index === 0 ? <span className="pipe-band-text">{MISSING.band}</span> : null}
              {index === 4 ? <span className="pipe-band-text">{MISSING.bandEnd}</span> : null}
            </div>
            <div className="pipe-slot">{slots[step.label]}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
