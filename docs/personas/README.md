# Personas

Five made-up people the SlashSlash site is written for. Use them to review a design: take each
persona through their pages, on their device and in their theme, and answer their review questions
yes or no, with a screenshot.

They are drafts based on the site's own copy, not on user research. The home page speaks plain
English to someone who owns a product, `/developers` and the tool pages speak to engineers, and the
PixelSlash compare and pricing pages speak to someone weighing it against a tool they already pay for.
Replace a draft with a real person when one is known.

Five is odd on purpose, so a persona vote always has a winner. Keep the count at five: to add a sixth,
remove one first.

The file is written in the same shape as the thrifty repo's persona file, so a shared persona review
can read it in any repo. Its `device`, `pages` and `questions` keys are this repo's own; a shared
reader may ignore them.

## Who the users are

| Visitor | Covered by | Gap |
| --- | --- | --- |
| Product owner who approves releases | Priya | Nobody who uses the tools day to day without being technical. |
| Engineer who would install it | Marcus | Nobody who reads the site without code, and nobody who uses it only through screenshots. |
| Indie developer who self-hosts | Sam | Nobody who would pay for hosting, since paid hosting is not live yet. |
| Engineering manager choosing a tool | Dana | Nobody outside software who has to justify the cost to a budget holder. |
| Accessibility or quality reviewer | Leo | Covers keyboard, zoom, motion and contrast, not screen reader output. |

The gaps are prompts, not personas: nothing here has been invented to fill them. Add one only when a
design review would be judged unfairly without that person.

## The personas

The table is generated from [`personas.json`](personas.json). Do not edit it by hand.

<!-- personas:start -->
| Persona | Group | Model | Device | Pages | Who | Looks for (page) |
| --- | --- | --- | --- | --- | --- | --- |
| Priya | Product owner | opus | phone, 390px, light | `/` | Priya, head of product at a 30-person software company. Not technical. She approves releases she cannot really inspect. Arrives from a link a developer sent her, opened on her phone between meetings. She may never scroll past the second screen. | Needs to see within ten seconds what problem this solves ("customers saw it before we did"), in her words, not CI words. Leaves when the first screen reads like developer tooling or she has to know what "a check" is. |
| Marcus | Engineer | opus | desktop, 1440px, dark; iPad | `/developers`, `/pixelslash/how-it-works`, `/pixelslash`, `/pixelslash/compare`, `/pixelslash/pricing` | Marcus, a senior frontend engineer who already uses PixelSlash. He reviews pull requests all day and has shipped a CSS change that broke a page nobody looked at. He came in through pixelslash.dev, from Hacker News, GitHub or a colleague, and is often in dark mode at a desktop, sometimes on an iPad. | Needs to see a real report, real commands, what runs where, whether it fits his CI, PixelSlash still feeling like itself inside the shared shell, and the rest of the suite visible but optional. Leaves when marketing gloss hides the mechanism, no code appears within a scroll or two, a screenshot looks staged, or the suite crowds out PixelSlash's own navigation. |
| Sam | Indie developer | opus | laptop, either theme | `/flakeslash`, `/toggleslash` | Sam, a solo founder or freelancer running a few sites. Careful with money and wary of licences. Arrives from GitHub or a tool page, and wants a working "Try it" and the licence line on the page. | Needs to see that it is free to self-host, what the Elastic License 2.0 lets him do, and a working try-it in a few lines. Leaves when the licence is unclear, setup looks heavy, or the tool page reads like a sales page with no command. |
| Dana | Buyer or manager | opus | laptop, 1440px, light | `/pixelslash/compare`, `/pixelslash/pricing` | Dana, an engineering manager who runs a team of eight and owns the CI budget. Already pays for, or is trialling, a visual testing service. Arrives from a search for an alternative, landing on compare or pricing. | Needs to see what it costs, how honest it is about its stage, and what she gives up by switching. Leaves when the stage is hidden or hyped, pricing is vague, or the comparison reads as one-sided. |
| Leo | Expert lens | opus | keyboard, 200% zoom, reduced motion, both themes | `/`, `/developers`, `/flakeslash`, `/toggleslash`, `/pixelslash`, `/pixelslash/how-it-works`, `/pixelslash/compare`, `/pixelslash/pricing` | Leo, a QA lead or engineer who cares about accessibility. Keyboard first, sometimes at 200% zoom, sometimes with reduced motion on. Arrives from anywhere, and judges the brand by whether the site practises what it sells. | Needs to see contrast that holds in both themes, visible focus, motion that respects the setting, and no sideways scroll, most of all on the slash demo, the report dialog, the theme toggle and the phone menu. Leaves when a site that sells "see what a change does" has broken focus states or flicker. |

### Review questions

**Priya**
- At 390px, does the first screen say what this is without jargon?
- Could she repeat the pitch to her CEO in one sentence?
- Does she know what to do next?

**Marcus**
- Is there a command or real output within the first two screens?
- Does dark mode look designed, not inverted?
- Can he copy every command?
- Does PixelSlash still feel like itself inside the shared shell?
- Is the way to the rest of the suite visible but optional?
- Does the tool switcher make sense without explanation?

**Sam**
- Is the licence stated plainly on the tool page?
- Does "Try it" work from a copy and paste?
- Are "works today" and "planned" clearly kept apart?

**Dana**
- Can she find the release stage and what it means without hunting?
- Does the comparison admit where the other tools win?
- Is "paid hosting is planned" clear and not buried?

**Leo**
- Can every control be reached and seen by keyboard?
- Does body text keep at least 4.5:1 contrast in Latte and Mocha?
- With reduced motion on, does anything still move?
<!-- personas:end -->

## Edit, add or remove

Everything lives in `personas.json`. Edit the file, then run:

```bash
bun scripts/personas.ts          # rewrites the generated part above
bun scripts/personas.ts --check  # exits 1 if the file is invalid or the generated part is stale
```

The `scripts` moon project runs the check in `lint`, so a stale table fails the gate.

* **Edit:** change `profile`, `focus`, `device`, `pages`, `questions`, `group` or `model` in place.
* **Add or remove:** keep exactly five. Keep an `id` once it has been used in a review, so past
  reviews still name the right person.
* **New subject** (say, a theme or a page layout): add a key to each persona's `focus`. The
  generated table shows `(none yet)` for a persona without one.
* **New group or model:** add it to `groups` or `models` first.

## Using them in a design review

* Take each persona through the pages listed for them, on the device and in the theme their line
  names. A phone persona is checked at phone width, not on a resized desktop.
* Answer each question yes or no, with a screenshot of the page it was asked about.
* Priya, Marcus and Dana carry the most weight on the suite home and the tool pages. Leo checks every
  page, with the keyboard and at 200% zoom.
* A design change names the personas it serves, and its look list answers their questions.
* When real visitors answer the site's "I would like your view" questions, update the persona they
  match.
