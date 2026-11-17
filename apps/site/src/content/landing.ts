/**
 * The landing page's words, agreed on 2026-11-10. The copy is fixed: change a
 * word only with the owner's yes. The short labels on the drawings (the step names, "Example", the band words)
 * come from the visuals brief and are extra labels, never replacements for the copy.
 */

export const HERO = {
  /** The h1, with its full stop. LANDING_HEADLINE in site.ts is the same line without it. */
  title: "See what a change really does, before your customers do.",
  lead: "Software teams check the code they change. Nobody checks what customers will actually see. slashslash closes that gap.",
  reviewed: "What the team reviewed",
  seen: "What your customers see",
  /** The text equivalent of the two panes, for screen readers. */
  description:
    "An illustration. On the left, a few edited lines of code, one of them highlighted. On the right, a checkout. The total gains a line for tax, as asked. The pay button also moves and changes colour, which nobody asked for, and it is circled.",
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
