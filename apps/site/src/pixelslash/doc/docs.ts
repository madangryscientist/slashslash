import security from "@pixelslash-src/SECURITY.md?raw";
import selfHost from "@pixelslash-src/apps/web/SELF-HOST.md?raw";
import { plainText } from "#/pixelslash/doc/doc-text";
import { type Doc, parseDoc } from "#/pixelslash/doc/markdown";

/*
 * The two PixelSlash repository documents served here as pages, fetched at the pinned commit
 * (scripts/fetch-sources.ts) and read at build time. Their words are the documents' own.
 */
export const SECURITY_DOC = parseDoc(security, "SECURITY.md");
export const SELF_HOST_DOC = parseDoc(selfHost, "apps/web/SELF-HOST.md");

/**
 * A document page's title and description: `title` (the document's first heading unless given) with
 * `suffix` after it, and its first paragraph as plain text.
 */
export function docPage(
  doc: Doc,
  { title = doc.title, suffix = " · PixelSlash" }: { title?: string; suffix?: string } = {},
): { title: string; description: string } {
  const paragraph = doc.tokens.find((token) => token.type === "paragraph");
  const description = paragraph?.type === "paragraph" ? plainText(paragraph.tokens).replace(/\s+/g, " ").trim() : "";
  if (title === "" || description === "") throw new Error(`${doc.source} has no title or no first paragraph`);
  return { title: `${title}${suffix}`, description };
}
