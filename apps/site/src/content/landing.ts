/**
 * The landing page's words, agreed on 2026-11-10. The copy is fixed: change a
 * word only with the owner's yes. The short labels on the drawings (the step names, "Example", the band words)
 * come from the visuals brief and are extra labels, never replacements for the copy.
 */

export const HERO = {
  /** The h1, with its full stop. LANDING_HEADLINE in site.ts is the same line without it. */
  title: "See what a change really does, before your customers do.",
  lead: "Software teams check the code they change. Nobody checks what customers will actually see. slashslash closes that gap.",
  /** The hero drawing's three step captions, left to right (top to bottom on a phone). */
  before: "Before",
  change: "The change",
  after: "After",
  /** The change itself, in plain pseudo code a visitor who does not write code can read. */
  codeLines: ["add a Tax line above Total", "colour new lines orange"],
  /** The labels in the After step: on the tax line, and beside the circled Pay button. */
  asked: "Asked for",
  notAsked: "Not asked for: the Pay button also turned orange and moved",
  /** The text equivalent of the three steps, for screen readers. */
  description:
    "An illustration in three steps: a checkout before, a change of two lines (add a Tax line above Total, and colour new lines orange), and the same checkout after. After the change the Tax line is orange, as asked, but the Pay button has also turned orange and moved, which nobody asked for, and it is circled.",
} as const;

export type Step = {
  /** The label on the drawing, from the visuals brief. */
  label: "Asked" | "Made" | "Approved" | "Checked" | "Live";
  /** The step's bold opening sentence, word for word. */
  lead: string;
  /** The rest of the step, word for word. */
  text: string;
};

export const TODAY = {
  title: "How a change reaches your customers today",
  /** Moves along the pipeline. The words are step 1's own example. */
  card: "Add tax to the checkout total",
  customer: "Customer",
  steps: [
    { label: "Asked", lead: "Someone asks for a change.", text: '"Add tax to the checkout total."' },
    { label: "Made", lead: "A developer makes it.", text: "They edit a few lines of code." },
    {
      label: "Approved",
      lead: "A colleague approves it.",
      text: "They read the edited lines, not the running product.",
    },
    {
      label: "Checked",
      lead: "Automated checks run.",
      text: "A green light means nothing that was tested broke.",
    },
    { label: "Live", lead: "It goes live.", text: "Your customers are the first to use the finished result." },
  ],
} as const satisfies { steps: readonly Step[] } & Record<string, unknown>;

export const STANDS = {
  reportAlt:
    "PixelSlash's review app for one change: a card on Main and the same card on Branch side by side, with the changed area outlined in red and a yellow bar on Branch.",
  reportOpen: "Open the report full screen",
  reportClose: "Close",
} as const;
