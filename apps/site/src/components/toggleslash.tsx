import { CopyLine, TextLink } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { Section } from "#/components/section";
import { LINKS, PLANNED, TOGGLESLASH_INTRO, TRY_IT, WORKS_TODAY } from "#/content/toggleslash";

/** /toggleslash: the page's h1 and what ToggleSlash is. */
export function ToggleSlashIntro(): ReactNode {
  return (
    <Section
      id="toggleslash"
      hunk="toggleslash"
      title={TOGGLESLASH_INTRO.title}
      heading="h1"
      lead={TOGGLESLASH_INTRO.lead}
    />
  );
}

/** What works today, each with the command, path or file that does it. */
export function ToggleSlashToday(): ReactNode {
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

/** The quickstart in short, from a clone. Hydrated for the copy buttons. */
export function ToggleSlashTry(): ReactNode {
  return (
    <Section id="try-it" hunk="try it" title="Try it on your own machine" lead={TRY_IT.lead}>
      {TRY_IT.steps.map((step) => (
        <div className="try-step" key={step.lead}>
          <p>{step.lead}</p>
          <div className="try-lines">
            {step.commands.map((command) => (
              <CopyLine key={command} text={command} />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}

/** What is planned, labelled as planned. */
export function ToggleSlashPlanned(): ReactNode {
  return (
    <Section
      id="planned"
      hunk="planned"
      title="Planned, not built"
      lead="These are planned. None of them works yet."
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

/** The docs stay in the ToggleSlash repository; this links to them. */
export function ToggleSlashLinks(): ReactNode {
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
