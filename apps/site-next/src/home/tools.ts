import { PRODUCTS } from "#content/products";
import type { StageId } from "#content/stages";
import { REPORT, STORY_TOOLS, type StoryTool } from "#next/content/story";
import { markFor, SECTIONS, type SectionKey } from "#next/shell/sections";

/** One card on the home: a tool the story names, with its question, its stage and its page here, if any. */
export type ToolCard = {
  name: StoryTool;
  mark: string;
  question: string;
  stage: StageId;
  /** The tool's home on this site; left out for a tool with no page here. */
  href?: string;
};

/** The home's tool cards, in the story's order. SightSlash has no product row yet: it is planned. */
export const TOOL_CARDS: readonly ToolCard[] = STORY_TOOLS.map((name) => {
  const row = REPORT.rows.find((r) => r.tool === name);
  if (row === undefined) throw new Error(`The story's report has no question for ${name}.`);
  const product = PRODUCTS.find((p) => p.name === name);
  const key = name.toLowerCase();
  const href = key in SECTIONS ? SECTIONS[key as SectionKey].home : undefined;
  return {
    name,
    mark: markFor(name),
    question: row.question,
    stage: product?.stage ?? "planned",
    ...(href === undefined ? {} : { href }),
  };
});
