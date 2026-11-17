import { Card, Container, Lead, ListRow, Pill, Section, Step, Steps, Text } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { STAGES, STAGE_TONE } from "#/content/stages";
import { HERO, PIPELINE } from "#/content/story";
import { TOOL_CARDS, type ToolCard } from "#/home/tools";
import { HeroPanes } from "#/illustrations/hero";
import { CentredHero } from "#/stand-ins/centred-hero";

/*
 * The suite home's first screen, on the kit's parts: the hero (the story's title and lead, over the
 * hand-drawn panes, with no link or button), then the pipeline: the steps a change goes through, in
 * order, each with the tools that run there and one sentence on what each does. Nothing here runs in
 * the browser; the page adds the Motion island beside it.
 */

function HomeHero(): ReactNode {
  return (
    <section className="hero-ground" aria-label="Introduction">
      <Container>
        <div className="pt-12 pb-8 md:pt-16">
          <CentredHero title={HERO.title}>
            <Lead>{HERO.lead}</Lead>
          </CentredHero>
          {/* The full column, so the panes line up with the pipeline below. */}
          <HeroPanes />
        </div>
      </Container>
    </section>
  );
}

/** A tool's row: its mark, its name and release stage, and what it does; a link to its page here if it has one. */
function ToolRow({ tool, divided }: { tool: ToolCard; divided: boolean }): ReactNode {
  return (
    <div data-tool={tool.name}>
      <ListRow
        divided={divided}
        {...(tool.href === undefined ? {} : { href: tool.href })}
        leading={<img src={tool.mark} alt="" width={28} height={28} />}
        secondary={tool.does}
      >
        <span className="inline-flex flex-wrap items-center gap-2">
          <strong>{tool.name}</strong>
          <Pill tone={STAGE_TONE[tool.stage]} dot round>
            {STAGES[tool.stage].label}
          </Pill>
        </span>
      </ListRow>
    </div>
  );
}

/** The pipeline: one numbered step per stage, in order, with the tools that run at it. */
function Pipeline(): ReactNode {
  return (
    <div id="tools" className="scroll-mt-24 py-16" data-home-section="tools">
      <Container>
        <Section id="pipeline" title={PIPELINE.title} level={2}>
          <Text>{PIPELINE.lead}</Text>
          <Steps>
            {PIPELINE.stages.map((stage) => {
              const tools = TOOL_CARDS.filter((tool) => tool.step === stage.name);
              return (
                <Step key={stage.name} title={<h3 className="font-semibold">{stage.name}</h3>} data-step={stage.name}>
                  <div className="space-y-4">
                    <Text>{stage.text}</Text>
                    {tools.length === 0 ? null : (
                      <Card flush>
                        {tools.map((tool, index) => (
                          <ToolRow key={tool.name} tool={tool} divided={index > 0} />
                        ))}
                      </Card>
                    )}
                  </div>
                </Step>
              );
            })}
          </Steps>
          <Text>{PIPELINE.next}</Text>
        </Section>
      </Container>
    </div>
  );
}

export function Home(): ReactNode {
  return (
    <>
      <HomeHero />
      <Pipeline />
    </>
  );
}
