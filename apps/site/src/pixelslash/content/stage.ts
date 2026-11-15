import { STAGES, type StageId } from "#/content/stages";

/**
 * PixelSlash's release stage. Every Hack Cove site states its stage from the shared `STAGES` table
 * in `#/content/stages`, so a visitor learns one vocabulary across all of them. Moving PixelSlash on
 * is this file's one edit: `STAGE` picks the row, and the home page and the footer both read it from
 * there.
 */

/** Where PixelSlash is today. */
export const STAGE: StageId = "alpha";

/** The stage as the one line a page prints: `Alpha. Changing fast. Expect breaking changes ...`. */
export const STAGE_LINE = `${STAGES[STAGE].label}. ${STAGES[STAGE].sentence}`;
