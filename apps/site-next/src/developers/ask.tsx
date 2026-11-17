import { Callout, Text } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { CONTACT_LINE } from "#content/site";
import { DEVELOPER_QUESTIONS } from "#next/developers/questions";
import { DevSection } from "#next/developers/section";

/** The ask: the developer questions, then how to answer. */
export function Ask(): ReactNode {
  return (
    <DevSection id="ask" hunk="feedback" title="I would like your view.">
      <ol className="list-decimal space-y-2 pl-6">
        {DEVELOPER_QUESTIONS.map((question) => (
          <li key={question}>
            <Text>{question}</Text>
          </li>
        ))}
      </ol>
      <Callout tone="info">{CONTACT_LINE}</Callout>
    </DevSection>
  );
}
