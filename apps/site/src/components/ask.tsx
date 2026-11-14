import type { ReactNode } from "react";
import { Section } from "#/components/section";
import { CONTACT_LINE } from "#/content/site";

export const DEVELOPER_QUESTIONS: readonly string[] = [
  "Have you had this problem?",
  "Which tool would you try first?",
  "Would you run a self-hosted server for this?",
  "What would make you trust a tool that says a flag is safe to remove?",
  "Would you want these tools together or separately?",
  "What already solves this for you?",
];

export function Ask({
  questions,
  hunk,
  title = "I would like your view.",
}: {
  questions: readonly string[];
  hunk?: string | undefined;
  title?: string;
}): ReactNode {
  return (
    <Section id="ask" hunk={hunk} title={title}>
      <ol className="questions">
        {questions.map((question, i) => (
          <li key={question}>
            <span className="tie-n mono" aria-hidden="true">{`0${i + 1}`}</span>
            {question}
          </li>
        ))}
      </ol>
      <p className="contact">
        <mark>{CONTACT_LINE}</mark>
      </p>
    </Section>
  );
}
