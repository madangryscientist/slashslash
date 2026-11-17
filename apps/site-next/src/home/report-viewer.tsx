import { Image, Lightbox } from "@hackcove/ui-react";
import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { STANDS } from "#content/landing";

/*
 * The real PixelSlash report, on the home's "Where it stands". A tap opens it full screen in the kit's
 * Lightbox, which Esc, the scrim and its close button close. With no script the link opens the image
 * itself. This is the only island the home's sections add.
 */

const SRC = "/report.png";

export function ReportViewer(): ReactNode {
  const [open, setOpen] = useState(false);
  const show = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setOpen(true);
  };
  return (
    <>
      <a href={SRC} aria-haspopup="dialog" onClick={show} className="group block space-y-2">
        {/* The kit's natural Image reserves no space, so the screenshot's own 1100 by 394 frame holds it. */}
        <span className="block aspect-[1100/394]">
          <Image src={SRC} alt={STANDS.reportAlt} aspect="natural" />
        </span>
        <span className="text-sm font-semibold underline-offset-4 group-hover:underline">{STANDS.reportOpen}</span>
      </a>
      {open ? (
        <Lightbox label={STANDS.reportAlt} closeLabel={STANDS.reportClose} onClose={() => setOpen(false)}>
          <img src={SRC} alt={STANDS.reportAlt} width={1100} height={394} />
        </Lightbox>
      ) : null}
    </>
  );
}
