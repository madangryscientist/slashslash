import { Pill } from "@hackcove/ui-react";
import { useRef } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Section } from "#/components/section";
import { STANDS } from "#/content/landing";
import { PRODUCTS } from "#/content/products";
import { STAGES, STAGE_TONE } from "#/content/stages";

/**
 * The real PixelSlash report. A tap opens it full screen in a modal dialog, which Esc closes. With no
 * JavaScript the link opens the image itself.
 */
function Report(): ReactNode {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!dialog.current) return;
    event.preventDefault();
    dialog.current.showModal();
  };
  const close = () => dialog.current?.close();
  return (
    <>
      <a className="report-open" href="/report.png" aria-haspopup="dialog" onClick={open}>
        <img src="/report.png" alt={STANDS.reportAlt} width={1100} height={394} loading="lazy" />
        <span className="report-open-label">{STANDS.reportOpen}</span>
      </a>
      <dialog ref={dialog} className="report-dialog" aria-label={STANDS.reportAlt} onClick={close}>
        <img src="/report.png" alt={STANDS.reportAlt} width={1100} height={394} />
        <button type="button" className="report-close" onClick={close}>
          {STANDS.reportClose}
        </button>
      </dialog>
    </>
  );
}

/** The product a chip is for. The chip's stage comes from that product, so it can never disagree with /developers. */
function productOf(tool: string): (typeof PRODUCTS)[number] {
  const product = PRODUCTS.find((p) => p.name === tool);
  if (!product) throw new Error(`No product named ${tool}`);
  return product;
}

/** Where it stands: a status chip per tool, and the real report. */
export function Stands(): ReactNode {
  return (
    <Section id="stands" title={STANDS.title}>
      <ul className="chips" data-play="">
        {STANDS.chips.map((chip, i) => {
          const { stage } = productOf(chip.tool);
          return (
            <li key={chip.tool} style={{ "--i": i }}>
              <span className="chip-tool">{chip.tool}</span>
              <Pill tone={STAGE_TONE[stage]} data-chip-for={chip.tool}>
                {STAGES[stage].label}
              </Pill>
              <span className="chip-stage">{STAGES[stage].sentence}</span>
            </li>
          );
        })}
      </ul>
      <div className="stands">
        <div className="stands-text">
          <p className="sec-body">{STANDS.text}</p>
          <p className="sec-body">{STANDS.hosted}</p>
          <p className="sec-body">
            <a href="/developers" className="dev-link">
              {STANDS.developers}
            </a>
          </p>
        </div>
        <Report />
      </div>
    </Section>
  );
}
