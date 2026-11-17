import type { Claim } from "#/content/facts";
import { PRODUCTS } from "#/content/products";
import type { StageId } from "#/content/stages";
import { PIPELINE, type StoryTool } from "#/content/story";
import { markFor, SECTIONS, type SectionKey } from "#/shell/sections";

/** One tool on the home: what it does, its release stage and its page here, if any. */
export type ToolCard = {
  name: StoryTool;
  mark: string;
  /** One sentence saying what it does. */
  does: Claim;
  stage: StageId;
  /** The tool's home on this site; left out for a tool with no page here. */
  href?: string;
};

/** Every tool the story names, in pipeline order. SightSlash has no product row yet: it is planned. */
export const TOOL_CARDS: readonly ToolCard[] = PIPELINE.stages.flatMap((stage) =>
  stage.tools.map(({ tool: name, does }): ToolCard => {
    const product = PRODUCTS.find((p) => p.name === name);
    const key = name.toLowerCase();
    const href = key in SECTIONS ? SECTIONS[key as SectionKey].home : undefined;
    return {
      name,
      mark: markFor(name),
      does,
      stage: product?.stage ?? "planned",
      ...(href === undefined ? {} : { href }),
    };
  }),
);
