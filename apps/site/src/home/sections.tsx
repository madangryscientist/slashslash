import { Container, Section, Text, TextLink } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { STANDS, VIEW, VIEW_QUESTIONS } from "#/content/story";
import { ContactLine } from "#/shell/contact-line";

/*
 * The rest of the suite home, after the pipeline: where it stands, and the ask. Each is a kit Section
 * whose title is an h2. Nothing here runs in the browser; "Where it stands" takes the report viewer
 * island as its children.
 */

/** One home section: the kit's Section in the page's column, its title an h2. */
export function HomeSection({ id, title, children }: { id: string; title: string; children: ReactNode }): ReactNode {
  return (
    <div className="py-12" data-home-section={id}>
      <Container>
        <Section id={id} title={title} level={2}>
          {children}
        </Section>
      </Container>
    </div>
  );
}

/** The stage line either side of the words that link to the CI walkthrough. */
const [stagesBefore, stagesAfter] = STANDS.stages.split(STANDS.tryLink.text);

/** Where it stands: the stage lines and the report screenshot (the children). */
export function Stands({ children }: { children?: ReactNode }): ReactNode {
  return (
    <HomeSection id="stands" title={STANDS.title}>
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        <div className="space-y-4">
          <Text>
            {stagesBefore}
            <TextLink href={STANDS.tryLink.href}>{STANDS.tryLink.text}</TextLink>
            {stagesAfter}
          </Text>
          <Text>{STANDS.selfHost}</Text>
          <Text>{STANDS.hosted}</Text>
        </div>
        <div>{children}</div>
      </div>
    </HomeSection>
  );
}

/** The ask, at #your-view, where the questions are. */
export function YourView(): ReactNode {
  return (
    <HomeSection id="your-view" title={VIEW.title}>
      <ol className="list-decimal space-y-2 pl-6">
        {VIEW_QUESTIONS.map((question) => (
          <li key={question}>
            <Text>{question}</Text>
          </li>
        ))}
      </ol>
      <ContactLine />
    </HomeSection>
  );
}
