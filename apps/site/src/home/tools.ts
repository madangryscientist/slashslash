import { PRODUCTS } from "#/content/products";
import type { StageId } from "#/content/stages";
import { PIPELINE, type StoryTool } from "#/content/story";
import { isSectionKey, markFor, SECTIONS } from "#/shell/sections";

/** One tool on the home: what it does, its release stage and its page here, if any. */
export type ToolCard = {
  name: StoryTool;
  mark: string;
  stage: StageId;
  /** The tool's home on this site; left out for a tool with no page here. */
  href?: string;
};

/** One card per tool the story names, at the first step it runs at, in pipeline order. */
export const TOOL_CARDS: readonly ToolCard[] = PIPELINE.stages
  .flatMap((stage) => stage.tools)
  .filter((row, index, rows) => rows.findIndex((other) => other.tool === row.tool) === index)
  .map(({ tool: name }): ToolCard => {
    const product = PRODUCTS.find((p) => p.name === name);
    const key = name.toLowerCase();
    const href = isSectionKey(key) ? SECTIONS[key].home : undefined;
    return {
      name,
      mark: markFor(name),
      stage: product?.stage ?? "planned",
      ...(href === undefined ? {} : { href }),
    };
  });
