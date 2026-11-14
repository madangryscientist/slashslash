# Personas for design review

Six people the marketing site is written for. Use them to review a design: take each persona through
their pages, on their device and in their theme, and answer their review questions yes or no, with a
screenshot.

They are drafts based on the site's own copy, not on user research. The home page speaks plain English to people who
own a product, `/developers` and the tool pages speak to engineers, and the PixelSlash compare and
pricing pages speak to someone weighing it against a tool they already pay for. Replace a draft with a
real person when one is known.

| Persona | Device and theme | Pages |
|---|---|---|
| Priya, product owner | phone, 390px, light | `/` |
| Marcus, frontend engineer | desktop, 1440px, dark | `/developers`, `/pixelslash/how-it-works`, docs |
| Dana, engineering manager | laptop, 1440px, light | `/pixelslash/compare`, `/pixelslash/pricing` |
| Sam, indie developer | laptop, either theme | `/flakeslash`, `/toggleslash`, try it, licence |
| Leo, accessibility reviewer | keyboard, 200% zoom, reduced motion, both themes | every page |
| Jo, returning PixelSlash user | desktop and iPad | `/pixelslash/*`, the tool switcher |

## 1. Priya, the product owner who got burned

- **Who:** head of product at a 30-person software company. Not technical. She approves releases she
  cannot really inspect.
- **Arrives from:** a link a developer sent her, opened on her phone between meetings.
- **Pages:** `/` only. She may never scroll past the second screen.
- **Needs to see within ten seconds:** what problem this solves ("customers saw it before we did"), in
  her words, not CI words.
- **Leaves when:** the first screen reads like developer tooling, or she has to know what "a check" is.
- **Review questions:**
  - At 390px, does the first screen say what this is without jargon?
  - Could she repeat the pitch to her CEO in one sentence?
  - Does she know what to do next?

## 2. Marcus, the senior frontend engineer

- **Who:** the person who would install it. He reviews pull requests all day and has shipped a CSS
  change that broke a page nobody looked at.
- **Arrives from:** Hacker News, GitHub or a colleague. Desktop at 1440px, often in dark mode.
- **Pages:** `/developers`, `/pixelslash/how-it-works`, the docs, the repository.
- **Needs to see:** a real report, real commands, what runs where, and whether it fits his CI.
- **Leaves when:** marketing gloss hides the mechanism, there is no code within a scroll or two, or a
  screenshot looks staged.
- **Review questions:**
  - Is there a command or real output within the first two screens?
  - Does dark mode look designed, not inverted?
  - Can he copy every command?

## 3. Dana, the engineering manager choosing a tool

- **Who:** runs a team of eight and owns the CI budget. Already pays for, or is trialling, a visual
  testing service.
- **Arrives from:** a search for an alternative, landing on compare or pricing.
- **Pages:** `/pixelslash/compare`, `/pixelslash/pricing`, the self-host and security pages.
- **Needs to see:** what it costs, how honest it is about its stage, and what she gives up by switching.
- **Leaves when:** the stage is hidden or hyped, pricing is vague, or the comparison reads as one-sided.
- **Review questions:**
  - Can she find the release stage and what it means without hunting?
  - Does the comparison admit where the other tools win?
  - Is "paid hosting is planned" clear and not buried?

## 4. Sam, the indie developer who self-hosts

- **Who:** a solo founder or freelancer running a few sites. Careful with money and wary of licences.
- **Arrives from:** GitHub, or a tool page.
- **Pages:** `/flakeslash` or `/toggleslash`, "Try it", the licence line, the repository.
- **Needs to see:** that it is free to self-host, what the Elastic License 2.0 lets him do, and a
  working try-it in a few lines.
- **Leaves when:** the licence is unclear, setup looks heavy, or the tool page reads like a sales page
  with no command.
- **Review questions:**
  - Is the licence stated plainly on the tool page?
  - Does "Try it" work from a copy and paste?
  - Are "works today" and "planned" clearly kept apart?

## 5. Leo, the accessibility and quality reviewer

- **Who:** a QA lead or an engineer who cares about accessibility. Keyboard first, sometimes at 200%
  zoom, sometimes with reduced motion on.
- **Arrives from:** anywhere. He judges the brand by whether the site practises what it sells.
- **Pages:** all of them, the interactive parts most of all: the slash demo, the report dialog, the
  theme toggle, the phone menu.
- **Needs to see:** contrast that holds in both themes, visible focus, motion that respects the
  setting, no sideways scroll.
- **Leaves when:** a site that sells "see what a change does" has broken focus states or flicker.
- **Review questions:**
  - Can every control be reached and seen by keyboard?
  - Does body text keep at least 4.5:1 contrast in Latte and Mocha?
  - With reduced motion on, does anything still move?

## 6. Jo, the returning PixelSlash user

- **Who:** already uses PixelSlash, came in through pixelslash.dev, and has never heard of the suite.
- **Arrives from:** a bookmark or pixelslash.dev, which this site now serves.
- **Pages:** `/pixelslash/*`, then perhaps the tool switcher.
- **Needs to see:** that PixelSlash is still the same product, and that the suite around it adds
  rather than distracts.
- **Leaves when:** a reskin makes PixelSlash feel like a different product, or the suite's chrome
  crowds out PixelSlash's own navigation.
- **Review questions:**
  - Does PixelSlash still feel like itself inside the shared shell?
  - Is the way to the rest of the suite visible but optional?
  - Does the tool switcher make sense without explanation?

## Using them

- Priya, Marcus and Dana carry the most weight on the suite home and the tool pages. Leo checks every
  page.
- A design change names the personas it serves, and its look list answers their questions.
- When real visitors answer the site's "I would like your view" questions, update the persona they
  match.
