/**
 * The landing page's words, agreed on 2026-11-10. The copy is fixed: change a
 * word only with the owner's yes. The short labels on the drawings (the step names, "Example", the band words)
 * come from the visuals brief and are extra labels, never replacements for the copy.
 */
import type { Product } from "#/content/products";

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

export const MISSING = {
  title: "What is missing",
  lead: "At every step, people look at the code. Nobody is shown what the change does.",
  /** In the copy's order. `at` is the step where each one slips through, from the visuals brief. */
  items: [
    { at: "Approved", text: "The approver sees edited lines, not the page your customer will see." },
    { at: "Made", text: "A small edit can switch on a feature nobody mentioned." },
    {
      at: "Live",
      text: "The live site has settings the test site does not, so the same code behaves differently.",
    },
    { at: "Checked", text: "Some checks fail at random, so teams learn to ignore a red light." },
  ],
  close: "Today that gap is filled by people testing by hand before each release. What they miss, customers find.",
  band: "looking at the code",
  bandEnd: "first look at the result",
} as const satisfies { items: readonly { at: Step["label"]; text: string }[] } & Record<string, unknown>;

export const COSTS = {
  title: "What it costs",
  text: "Each surprise costs you twice: once when a customer hits it, and again when the team stops to fix it. Release days run long while people click through the product by hand. And engineers spend time rechecking work instead of building the next thing.",
  /** The loop, clockwise, from the visuals brief. */
  loop: ["Customer hits it", "Support hears about it", "The team stops", "The fix ships"],
} as const;

export const ADDS = {
  title: "What slashslash adds",
  text: "Every change arrives with a plain report of what it will do. It appears on the change itself, in the place your team already reviews and approves work, as one more check alongside the ones they already trust. Nobody has to open a new tool. Developers can click through for the full detail when they need it.",
  questionsLead: "The report answers four questions:",
  questions: [
    { question: "Does the page look different?", tool: "PixelSlash" },
    { question: "What switches on, and for whom?", tool: "ToggleSlash" },
    { question: "Can we trust the test results?", tool: "FlakeSlash" },
    { question: "Did the app get slower to load?", tool: "BundleSlash" },
  ],
  close:
    "Step 3 becomes: a colleague approves it, having seen what customers will see. Step 4 gains a check that says what the change does, not only whether something broke.",
  /** The report card's own labels, from the visuals brief. */
  example: "Example",
  coming: "coming",
  checkName: "slashslash",
  checkResult: "Passed",
  /** Where the card attaches on the pipeline. */
  attachedAt: ["Approved", "Checked"],
} as const satisfies {
  questions: readonly { question: string; tool: Product["name"] }[];
  attachedAt: readonly Step["label"][];
} & Record<string, unknown>;

export const STANDS = {
  title: "Where it stands",
  text: "PixelSlash works today. It takes a picture of every changed page before and after, marks what moved, and already runs inside a team's existing automated checks. Showing its report directly on the change, where it is approved, comes next. All three are in alpha: PixelSlash is furthest along, and ToggleSlash and FlakeSlash are earlier. BundleSlash is planned.",
  hosted: "A hosted version, run for you, is planned. Pricing will follow once running costs are known.",
  developers: "Developers: how it works and how to try it.",
  /** The four chips, one per tool. Each shows its product's stage label, tone and sentence. */
  chips: [{ tool: "PixelSlash" }, { tool: "ToggleSlash" }, { tool: "FlakeSlash" }, { tool: "BundleSlash" }],
  reportAlt:
    "The real PixelSlash report for a checkout change: the page before, the page after with a tax line added and the pay button turned from blue to green, and the changed area marked.",
  reportOpen: "Open the report full screen",
  reportClose: "Close",
} as const satisfies {
  chips: readonly { tool: Product["name"] }[];
} & Record<string, unknown>;

export const VIEW = {
  title: "I would like your view",
  questions: [
    "Has a software release ever surprised you or your customers?",
    "Which of the four questions would you most want answered?",
    "Was anything on this page hard to follow?",
    "Would you want these tools together or separately?",
  ],
} as const;
