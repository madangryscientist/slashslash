import { Callout, Card, Container, ListRow, Pill, Section, Step, Steps, Text } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { STAGES, STAGE_TONE } from "#content/stages";
import { CONTACT_LINE } from "#content/site";
import { GAPS, HERO, REPORT, STANDS, STEPS_TODAY, VIEW_QUESTIONS, type StoryTool } from "#next/content/story";
import { TOOL_CARDS } from "#next/home/tools";
import { Pipeline } from "#next/illustrations/pipeline";

/*
 * The rest of the suite home, after the tool cards, in the order and words of the suite story: how a
 * change reaches customers today, the gaps the old way left, the one report, where it stands, and the
 * ask. Each is a kit Section whose title is an h2. Nothing here runs in the browser; "Where it stands"
 * takes the report viewer island as its children.
 */

/** One home section: the kit's Section in the page's column, its title an h2. */
function HomeSection({ id, title, children }: { id: string; title: string; children: ReactNode }): ReactNode {
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

/** A tool by its mark and name, linked to its page here when it has one. */
function ToolName({ name }: { name: StoryTool }): ReactNode {
  const card = TOOL_CARDS.find((tool) => tool.name === name);
  if (card === undefined) throw new Error(`No tool card for ${name}.`);
  const body = (
    <span className="inline-flex items-center gap-2 font-semibold">
      <img src={card.mark} alt="" width={20} height={20} />
      {name}
    </span>
  );
  return card.href === undefined ? body : (
    <a href={card.href} className="underline-offset-4 hover:underline">
      {body}
    </a>
  );
}

export function StepsToday(): ReactNode {
  return (
    <HomeSection id="how-today" title={STEPS_TODAY.title}>
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        <Steps>
          {STEPS_TODAY.steps.map((step) => (
            <Step key={step.label} title={<strong>{step.label}</strong>}>
              {step.text}
            </Step>
          ))}
        </Steps>
        <Pipeline />
      </div>
    </HomeSection>
  );
}

export function Gaps(): ReactNode {
  return (
    <HomeSection id="gaps" title={GAPS.title}>
      <Text>{GAPS.lead}</Text>
      <Card flush>
        {GAPS.rows.map((row, index) => (
          <ListRow
            key={`${row.where}-${row.tool}`}
            divided={index > 0}
            data-gap={row.tool}
            leading={
              <span className="inline-block w-24">
                <Pill tone="neutral" round>
                  {row.where}
                </Pill>
              </span>
            }
            secondary={<ToolName name={row.tool} />}
          >
            {row.gap}
          </ListRow>
        ))}
      </Card>
      <Text>{GAPS.close}</Text>
    </HomeSection>
  );
}

export function OneReport(): ReactNode {
  return (
    <HomeSection id="report" title={REPORT.title}>
      <Text>{REPORT.body}</Text>
      <Card flush>
        {REPORT.rows.map((row, index) => (
          <ListRow
            key={row.tool}
            divided={index > 0}
            data-report={row.tool}
            leading={
              <span className="inline-block w-32 whitespace-nowrap">
                <ToolName name={row.tool} />
              </span>
            }
            secondary={row.why}
          >
            <span className="font-semibold">{row.question}</span>
          </ListRow>
        ))}
      </Card>
      <Text>{REPORT.next}</Text>
      <Text>{REPORT.close}</Text>
    </HomeSection>
  );
}

/** Where it stands: the stage lines, a stage Pill per tool, and the report screenshot (the children). */
export function Stands({ children }: { children?: ReactNode }): ReactNode {
  return (
    <HomeSection id="stands" title={STANDS.title}>
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        <div className="space-y-4">
          <Text>{STANDS.stages}</Text>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {TOOL_CARDS.map((tool) => (
              <li key={tool.name} className="inline-flex items-center gap-2" data-stage-for={tool.name}>
                <ToolName name={tool.name} />
                <Pill tone={STAGE_TONE[tool.stage]} dot round>
                  {STAGES[tool.stage].label}
                </Pill>
              </li>
            ))}
          </ul>
          <Text>{STANDS.selfHost}</Text>
          <Text>{STANDS.hosted}</Text>
        </div>
        <div>{children}</div>
      </div>
    </HomeSection>
  );
}

/** The ask: the hero's first action lands here. */
export function YourView(): ReactNode {
  return (
    <HomeSection id="your-view" title={HERO.actions[0].label}>
      <ol className="list-decimal space-y-2 pl-6">
        {VIEW_QUESTIONS.map((question) => (
          <li key={question}>
            <Text>{question}</Text>
          </li>
        ))}
      </ol>
      <Callout tone="info">{CONTACT_LINE}</Callout>
    </HomeSection>
  );
}
