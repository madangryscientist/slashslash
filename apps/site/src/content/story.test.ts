import { describe, expect, test } from "vitest";
import { PRODUCTS } from "#/content/products";
import * as story from "#/content/story";

/** Every string in the story module, found by walking each export, so a string added later is checked too. */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out);
  else if (value !== null && typeof value === "object")
    for (const item of Object.values(value)) collectStrings(item, out);
  return out;
}

const strings = collectStrings(story);

/** Splits a paragraph into its sentences, so a test can read one sentence at a time. */
const sentences = (text: string): string[] => text.split(/(?<=\.)\s+/);

/** The tools a sentence names, in the story's own list of tools. */
const namedIn = (text: string): StoryToolName[] =>
  story.STORY_TOOLS.filter((tool) => text.includes(tool));

type StoryToolName = (typeof story.STORY_TOOLS)[number];

const sentenceWith = (text: string, phrase: string): string => {
  const found = sentences(text).find((sentence) => sentence.includes(phrase));
  if (found === undefined) throw new Error(`no sentence contains "${phrase}"`);
  return found;
};

describe("suite story copy", () => {
  test("no string counts the tools", () => {
    const counted =
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|all (two|three|four|five|six))\s+(Slash\s+)?(tools?|products?)\b/i;
    expect(strings.filter((text) => counted.test(text))).toEqual([]);
  });

  test("no string contains an en dash or an em dash", () => {
    expect(strings.filter((text) => /[\u2013\u2014]/.test(text))).toEqual([]);
  });

  test("no string uses a word the live site rules out (the live ban, less agent and token)", () => {
    const forbidden =
      /salary|\bclients?\b|employer|job hunt|notice period|Unleash|Flagsmith|GrowthBook|PostHog|Piranha|OpenFeature|LaunchDarkly MCP/i;
    expect(strings.filter((text) => forbidden.test(text))).toEqual([]);
  });

  test("every PRODUCTS entry, and SightSlash, has exactly one GAPS row and one REPORT row", () => {
    for (const tool of story.STORY_TOOLS) {
      expect(story.GAPS.rows.filter((row) => row.tool === tool), `GAPS ${tool}`).toHaveLength(1);
      expect(story.REPORT.rows.filter((row) => row.tool === tool), `REPORT ${tool}`).toHaveLength(1);
    }
    expect(story.GAPS.rows).toHaveLength(story.STORY_TOOLS.length);
    expect(story.REPORT.rows).toHaveLength(story.STORY_TOOLS.length);
  });

  test("the stage sentences name exactly the alpha tools and exactly the planned tools", () => {
    const alpha = PRODUCTS.filter((p) => p.stage === "alpha").map((p) => p.name);
    const planned = [
      ...PRODUCTS.filter((p) => p.stage === "planned").map((p) => p.name),
      "SightSlash" as const,
    ];
    const alphaSentence = sentenceWith(story.STANDS.stages, "are alphas");
    const plannedSentence = sentenceWith(story.STANDS.stages, "are planned");
    expect(namedIn(alphaSentence).toSorted()).toEqual(alpha.toSorted());
    expect(namedIn(plannedSentence).toSorted()).toEqual(planned.toSorted());
  });

  test("the stage line holds the words its CI link wraps", () => {
    expect(story.STANDS.stages).toContain(story.STANDS.tryLink.text);
  });

  test("the self-host sentence names exactly the SELF_HOSTED tools", () => {
    const named = namedIn(story.STANDS.selfHost).toSorted();
    expect(named).toEqual([...story.SELF_HOSTED].toSorted());
  });
});
