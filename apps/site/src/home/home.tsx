import { Card, CardGrid, Container, Lead, Pill, Stack, Text } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { STAGES, STAGE_TONE } from "#/content/stages";
import { HERO } from "#/content/story";
import { TOOL_CARDS, type ToolCard } from "#/home/tools";
import { HeroPanes } from "#/illustrations/hero";
import { CentredHero } from "#/stand-ins/centred-hero";

/*
 * The suite home's first screen, on the kit's parts: the hero (the story's title and lead, over the
 * hand-drawn panes, with no link or button) and a card for every tool the story names. Nothing here runs
 * in the browser; the page adds the Motion island beside it.
 */

function HomeHero(): ReactNode {
  return (
    <section className="hero-ground" aria-label="Introduction">
      <Container>
        <div className="pt-12 pb-8 md:pt-16">
          <CentredHero title={HERO.title}>
            <Lead>{HERO.lead}</Lead>
          </CentredHero>
          <div className="mx-auto max-w-5xl">
            <HeroPanes />
          </div>
        </div>
      </Container>
    </section>
  );
}

/** A tool's card: its mark and name, the question it answers, its stage, and a link to its page here if it has one. */
function ToolCardView({ tool }: { tool: ToolCard }): ReactNode {
  const body = (
    <Stack gap="sm">
      <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
        <img src={tool.mark} alt="" width={28} height={28} />
        {tool.name}
      </h2>
      <Text>{tool.question}</Text>
      <span>
        <Pill tone={STAGE_TONE[tool.stage]} dot round>
          {STAGES[tool.stage].label}
        </Pill>
      </span>
    </Stack>
  );
  return tool.href === undefined ? (
    <Card size="lg" data-tool={tool.name}>
      {body}
    </Card>
  ) : (
    <Card size="lg" href={tool.href} data-tool={tool.name}>
      {body}
    </Card>
  );
}

export function Home(): ReactNode {
  return (
    <>
      <HomeHero />
      <div id="tools" className="scroll-mt-24 py-16">
        <Container>
          <CardGrid columns={3}>
            {TOOL_CARDS.map((tool) => (
              <ToolCardView key={tool.name} tool={tool} />
            ))}
          </CardGrid>
        </Container>
      </div>
    </>
  );
}
