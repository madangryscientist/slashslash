import { describe, expect, test } from "vitest";
import { PRODUCTS } from "#/content/products";
import { HERO, PIPELINE, STANDS } from "#/content/story";

const written = PIPELINE.stages.find((stage) => stage.name === "Written");

describe("UISlash on the site, in the approved words", () => {
  test("its home card under Written is the approved line, word for word", () => {
    expect(written?.tools.map(({ tool, does }) => ({ tool, does: does.text }))).toEqual([
      {
        tool: "UISlash",
        does: "UISlash hands an agent React components that take props alone and accept no className or style, which leaves it no way to style a page off the design.",
      },
    ]);
  });

  test("its PRODUCTS entry is the approved question and summary, word for word", () => {
    const entry = PRODUCTS.find((product) => product.name === "UISlash");
    expect({ ...entry, question: entry?.question.text, summary: entry?.summary.map((claim) => claim.text) }).toEqual({
      name: "UISlash",
      stage: "alpha",
      facts: "uislash",
      question: "Can the agent build the UI without writing its own CSS?",
      summary: [
        "React components (@hackcove/ui-react) and seven themes (@hackcove/themes: four light, three dark, one CSS file each), and a site is built from them with props alone because no exported component accepts className or style.",
        "Early (every package at 0.x) and MIT licensed. Every theme is tested against WCAG AA contrast, a reusable GitHub workflow runs a rule check that fails the pull request plus an advisory model review, and the docs and an llms.txt for agents are at hack-cove.com/ui/.",
      ],
    });
  });

  test("the Written step's text is the approved line, word for word", () => {
    expect(written?.text.text).toBe(
      "An agent writes the change in minutes, often touching more than a person would, and here it gets ready parts to build the screens from. Slash still does not write the code: it hands over the parts, then checks what the code does at each step after this one.",
    );
  });

  test("the hero lead ends with the approved sentence, word for word", () => {
    expect(HERO.lead.text).toBe(
      "Agents now write a lot of the code, and nobody reads every line any more. The old checks were built for a person reading a person's work, and they let a lot slip through. Slash adds a tool at each step a change goes through, from the first line written to the release, so what a change really does shows up before your customers find it.",
    );
  });

  test("the alpha sentence names UISlash first and the rest of the paragraph is unchanged", () => {
    expect(STANDS.stages.text).toBe(
      "UISlash, TaskSlash, FlakeSlash, PixelSlash and ToggleSlash are alphas: try them and see what they do (start with how it works in CI). Expect the screens to change a lot, and expect bugs, which get fixed as they turn up. Between alpha versions, what the tools have stored (approvals, history, settings) may be reset. Your code and your customers' data are never touched. BundleSlash and SightSlash are planned.",
    );
  });
});
