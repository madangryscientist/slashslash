import { CopyLine, TextLink } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { Section } from "#/components/section";
import { FLAKESLASH_INTRO, LINKS, PLANNED, TRY_IT, WORKS_TODAY } from "#/content/flakeslash";

/** /flakeslash: the page's h1 and what FlakeSlash is. */
export function FlakeSlashIntro(): ReactNode {
  return (
    <Section
      id="flakeslash"
      hunk="flakeslash"
      title={FLAKESLASH_INTRO.title}
      heading="h1"
      lead={FLAKESLASH_INTRO.lead}
    />
  );
}

/** What the CLI does today, each with the command or flag that does it. */
export function FlakeSlashToday(): ReactNode {
  return (
    <Section id="works-today" hunk="works today" title="What works today">
      <ul className="today">
        {WORKS_TODAY.map((feature) => (
          <li key={feature.title}>
            <h3>{feature.title}</h3>
            <p className="tool-q">
              <code>{feature.command}</code>
            </p>
            <p>{feature.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** How to run it from a clone. Hydrated for the copy buttons. */
export function FlakeSlashTry(): ReactNode {
  return (
    <Section id="try-it" hunk="try it" title="Try it on your own repo" lead={TRY_IT.lead}>
      <div className="try-lines">
        {TRY_IT.commands.map((command) => (
          <CopyLine key={command} text={command} />
        ))}
      </div>
    </Section>
  );
}

/** What docs/product.md plans, labelled as planned. */
export function FlakeSlashPlanned(): ReactNode {
  return (
    <Section
      id="planned"
      hunk="planned"
      title="Planned, not built"
      lead="The design in the repository plans these. None of them works yet."
    >
      {/* The div takes the gap under the lead, which .tool-points' own margin would cancel. */}
      <div>
        <ul className="tool-points">
          {PLANNED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** The docs stay in the FlakeSlash repository; this links to them. */
export function FlakeSlashLinks(): ReactNode {
  return (
    <Section id="docs" hunk="docs" title="Read more">
      <p className="tool-links">
        {LINKS.map((link) => (
          <TextLink key={link.href} href={link.href} external>
            {link.label}
          </TextLink>
        ))}
      </p>
    </Section>
  );
}
