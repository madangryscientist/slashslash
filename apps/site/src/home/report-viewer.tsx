import { Image, Lightbox } from "@hackcove/ui-react";
import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { STANDS } from "#/content/landing";
import { psAsset } from "#/pixelslash/paths";

/*
 * The real PixelSlash review screenshot, on the home's "Where it stands", fetched with the pinned
 * PixelSlash files. A tap opens it full screen in the kit's Lightbox, which Esc, the scrim and its
 * close button close. With no script the link opens the image itself. This is the only island the
 * home's sections add.
 */

const SRC = psAsset("/report.png");
/** The screenshot's own pixel size, 2560 by 1600. */
const WIDTH = 2560;
const HEIGHT = 1600;

export function ReportViewer(): ReactNode {
  const [open, setOpen] = useState(false);
  const show = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setOpen(true);
  };
  return (
    <>
      <a href={SRC} aria-haspopup="dialog" onClick={show} className="group block space-y-2">
        {/* The kit's natural Image reserves no space, so the screenshot's own 2560 by 1600 frame holds it. */}
        <span className="block aspect-[2560/1600]">
          <Image src={SRC} alt={STANDS.reportAlt} aspect="natural" />
        </span>
        <span className="font-semibold underline-offset-4 group-hover:underline">{STANDS.reportOpen}</span>
      </a>
      {open ? (
        <Lightbox label={STANDS.reportAlt} closeLabel={STANDS.reportClose} onClose={() => setOpen(false)}>
          <img src={SRC} alt={STANDS.reportAlt} width={WIDTH} height={HEIGHT} />
        </Lightbox>
      ) : null}
    </>
  );
}
