import type { CSSProperties, ReactNode } from "react";
import { HERO } from "#/content/landing";

/*
 * The suite home's hand-drawn hero, redrawn on the theme's variables
 * (hero.css). Two panes: the edited lines the team reviewed, and the checkout customers see. With
 * motion on, the checkout gains tax (asked for), and its button also moves and recolours (not asked
 * for), circled. With no script or reduced motion, it is simply the finished drawing.
 */

/** Abstract edited lines: widths only, no real code. The fourth is the edit the team reviewed. */
const LINES: readonly { width: number; indent: number; edit?: true }[] = [
  { width: 46, indent: 0 },
  { width: 62, indent: 1 },
  { width: 38, indent: 1 },
  { width: 70, indent: 1, edit: true },
  { width: 30, indent: 1 },
  { width: 22, indent: 0 },
];

function Bar({ width }: { width: number }): ReactNode {
  return <i className="bar" style={{ "--w": `${width}%` } as CSSProperties} />;
}

export function HeroPanes(): ReactNode {
  return (
    <div className="panes" data-play="" data-testid="hero-panes" role="img" aria-label={HERO.description}>
      <figure className="pane">
        <figcaption className="pane-cap">{HERO.reviewed}</figcaption>
        <div className="code">
          {LINES.map((line, i) => (
            <span
              className={line.edit ? "code-line is-edit" : "code-line"}
              key={i}
              style={{ "--indent": line.indent } as CSSProperties}
            >
              <span className="code-sign">{line.edit ? "+" : ""}</span>
              <Bar width={line.width} />
            </span>
          ))}
        </div>
      </figure>
      <figure className="pane">
        <figcaption className="pane-cap">{HERO.seen}</figcaption>
        <div className="shop">
          <span className="shop-head">
            <Bar width={40} />
          </span>
          <span className="shop-row">
            <span>Subtotal</span>
            <Bar width={30} />
          </span>
          <span className="shop-row shop-tax">
            <span>Tax</span>
            <Bar width={18} />
          </span>
          <span className="shop-row shop-total">
            <span>Total</span>
            <Bar width={34} />
          </span>
          <span className="shop-pay">
            <span className="shop-btn">Pay</span>
            <svg className="shop-ring" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
              <path pathLength={1} d="M52 3C20 2 3 9 3 20s20 18 47 18 47-6 47-18S80 2 44 5" />
            </svg>
          </span>
        </div>
      </figure>
    </div>
  );
}
