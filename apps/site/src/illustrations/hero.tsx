import type { ReactNode } from "react";
import { HERO } from "#/content/landing";

/*
 * The suite home's hand-drawn hero, on the theme's variables (hero.css). Three steps, in order: the
 * checkout Before, The change (two plain lines of pseudo code), and the same checkout After. After the
 * change the checkout has its tax line, as asked, and its Pay button has also moved and turned the new
 * lines' colour, which nobody asked for, so it is circled. With motion on, the change lights up, then
 * the After checkout gains its tax, then its button moves, then the ring draws. With no script or
 * reduced motion, it is simply the finished drawing.
 */

function Bar({ width }: { width: number }): ReactNode {
  return <i className="bar" style={{ "--w": `${width}%` }} />;
}

/** One checkout. Before and After are the same drawing, so they line up row for row. */
function Checkout({ after = false }: { after?: boolean }): ReactNode {
  return (
    <div className={after ? "shop is-after" : "shop"}>
      <span className="shop-head">
        <Bar width={40} />
      </span>
      <span className="shop-row">
        <span>Subtotal</span>
        <Bar width={30} />
      </span>
      {after ? (
        <span className="shop-row shop-tax">
          <span>
            Tax <span className="shop-tag">{HERO.asked}</span>
          </span>
          <Bar width={18} />
        </span>
      ) : null}
      <span className="shop-row shop-total">
        <span>Total</span>
        <Bar width={34} />
      </span>
      <span className="shop-pay">
        <span className="shop-btn">Pay</span>
        {after ? (
          <svg className="shop-ring" viewBox="0 0 120 40" preserveAspectRatio="none">
            <path pathLength={1} d="M64 3C30 2 8 2 4 8C1 13 1 27 4 32C8 38 30 38 60 38S112 38 116 32C119 27 119 13 116 8C112 2 90 2 52 5" />
          </svg>
        ) : null}
      </span>
      {after ? <span className="shop-note">{HERO.notAsked}</span> : null}
    </div>
  );
}

export function HeroPanes(): ReactNode {
  return (
    <div className="panes" data-play="" data-testid="hero-panes" role="img" aria-label={HERO.description}>
      <figure className="pane" aria-hidden="true">
        <figcaption className="pane-cap">{HERO.before}</figcaption>
        <Checkout />
      </figure>
      <figure className="pane" aria-hidden="true">
        <figcaption className="pane-cap">{HERO.change}</figcaption>
        <div className="code">
          {HERO.codeLines.map((line) => (
            <span className="code-line" key={line}>
              <span className="code-sign">+</span>
              <span>{line}</span>
            </span>
          ))}
        </div>
      </figure>
      <figure className="pane pane-after" aria-hidden="true">
        <figcaption className="pane-cap">{HERO.after}</figcaption>
        <Checkout after />
      </figure>
    </div>
  );
}
