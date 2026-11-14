import type { ReactNode } from "react";
import { ChangeCard, Customer, Pipeline } from "#/components/pipeline";
import { Section } from "#/components/section";
import { TODAY } from "#/content/landing";

/** How a change reaches your customers today: the change card travels the five steps. */
export function ReachesToday(): ReactNode {
  const slots = Object.fromEntries(
    TODAY.steps.map((step, index) => [
      step.label,
      <>
        <ChangeCard />
        <p className="pipe-text">
          <strong>{step.lead}</strong> {step.text}
        </p>
        {index === TODAY.steps.length - 1 ? <Customer /> : null}
      </>,
    ]),
  );
  return (
    <Section id="how-today" title={TODAY.title}>
      <Pipeline variant="today" label={TODAY.title} slots={slots} playEach />
    </Section>
  );
}
