import { ANCHOR_PAGE } from "#/pixelslash/doc/cli";
import { DOCS } from "#/pixelslash/doc/resolve-links";

/**
 * `/docs#anchor` was one page before PixelSlash's docs were cut up. A hash never reaches the server,
 * so the docs index carries the answer: a tiny script that sends an old anchor to the page that now
 * holds it. Run as written, it reads the global `location`.
 */
export function oldAnchorScript(anchorPage: Readonly<Record<string, string>>): string {
  const map = JSON.stringify(anchorPage);
  return `(function(){var h=decodeURIComponent(location.hash.slice(1));if(!h)return;var m=${map};if(Object.prototype.hasOwnProperty.call(m,h))location.replace(${JSON.stringify(`${DOCS}/`)}+m[h]+"#"+h)})()`;
}

export const OLD_ANCHOR_SCRIPT = oldAnchorScript(ANCHOR_PAGE);
