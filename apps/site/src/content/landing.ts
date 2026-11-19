/**
 * The landing page's words, agreed on 2026-11-10. The copy is fixed: change a
 * word only with the owner's yes. The short labels on the drawings (the step names, "Example", the band words)
 * come from the visuals brief and are extra labels, never replacements for the copy.
 */

export const HERO = {
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
