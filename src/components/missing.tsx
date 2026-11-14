import type { ReactNode } from "react";
import { Pipeline } from "#/components/pipeline";
import { Section } from "#/components/section";
import { MISSING } from "#/content/landing";

/** What is missing: the same pipeline, the gap marked on it, each missing thing at its step. */
export function Missing(): ReactNode {
  const slots = Object.fromEntries(
    MISSING.items.map((item) => [
      item.at,
      <p className="pipe-mark" key={item.at}>
        <span className="pipe-mark-sign" aria-hidden="true">
          !
        </span>
        {item.text}
      </p>,
    ]),
  );
  return (
    <Section id="missing" title={MISSING.title} lead={MISSING.lead}>
      <Pipeline
        variant="missing"
        label={`The five steps again. Steps 1 to 4: ${MISSING.band}. Step 5: ${MISSING.bandEnd}.`}
        slots={slots}
      />
      <p className="sec-close">{MISSING.close}</p>
    </Section>
  );
}
