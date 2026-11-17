import {
  BulletItem,
  BulletList,
  Button,
  Card,
  CardGrid,
  Cluster,
  Code,
  Container,
  Lead,
  Pill,
  Section,
  Stack,
  Text,
} from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { STAGES, STAGE_TONE } from "#/content/stages";
import { LicenceLine } from "#/shell/licence-line";
import { SECTIONS } from "#/shell/sections";
import { CentredHero, CentredRow } from "#/stand-ins/centred-hero";
import { promiseOf, stageOf, type Tool } from "#/tools/tools";

/*
 * A tool's home on the Slash shell, on the kit's parts: the hero (the lockup, the stage, the promise,
 * the way in), what works today, how to try it, what is planned and where to read more. Every tool
 * home differs only in the Tool it passes. The copy blocks are islands: the page hands them in
 * hydrated, through `heroCode` and `tryIt`, and nothing else here runs in the browser.
 */

/** The tool's lockup: its mark and its name. */
function Lockup({ tool }: { tool: Tool }): ReactNode {
  const { mark, name } = SECTIONS[tool.key];
  return (
    <span className="inline-flex items-center gap-2" data-testid="lockup">
      <img src={mark} alt="" width={24} height={24} />
      {name}
    </span>
  );
}

/** The stage the tool is at, as a Pill, and the sentence that says what it means for a user. */
function StageLine({ tool }: { tool: Tool }): ReactNode {
  const stage = stageOf(tool);
  const { label, sentence } = STAGES[stage];
  return (
    <p data-testid="stage">
      <Pill tone={STAGE_TONE[stage]} dot round>
        {label}
      </Pill>{" "}
      <Text as="span" tone="muted">
        {sentence}
      </Text>
    </p>
  );
}

export function ToolHome({
  tool,
  heroCode,
  tryIt,
}: {
  tool: Tool;
  /** The hydrated HeroCode, handed in by the page as a named slot. */
  heroCode?: ReactNode;
  /** The hydrated TryIt, handed in by the page as a named slot. */
  tryIt?: ReactNode;
}): ReactNode {
  return (
    <>
      <section id={tool.key} className="hero-ground">
        <Container>
          <div className="pt-12 pb-4 md:pt-16">
            <CentredHero overline={<Lockup tool={tool} />} title={promiseOf(tool)}>
              <StageLine tool={tool} />
              <Lead>{tool.lead.text}</Lead>
              <LicenceLine product={tool.facts} />
              <CentredRow>
                <Button href="#try-it" size="lg">
                  Try it
                </Button>
                <Button href={tool.repo} variant="outline" size="lg">
                  Repository on GitHub
                </Button>
              </CentredRow>
              <div className="min-w-0 text-left">{heroCode}</div>
            </CentredHero>
          </div>
        </Container>
      </section>
      <div className="py-16">
        <Container>
          <Stack gap="xl">
            <Section id="works-today" size="lg" title="What works today">
              <CardGrid columns={2}>
                {tool.today.map((feature) => (
                  <Card key={feature.title} title={feature.title} titleStyle="name" size="lg">
                    <Stack gap="sm">
                      <span>
                        <Code>{feature.command}</Code>
                      </span>
                      <Text>{feature.text.text}</Text>
                    </Stack>
                  </Card>
                ))}
              </CardGrid>
            </Section>
            <Section id="try-it" size="lg" title={`Try it on ${tool.tryOn}`} description={tool.tryIt.lead.text}>
              {tryIt}
            </Section>
            <Section id="planned" size="lg" title="Planned, not built" description={tool.planned.lead}>
              <Card>
                <BulletList>
                  {tool.planned.items.map((item) => (
                    <BulletItem key={item.text}>{item.text}</BulletItem>
                  ))}
                </BulletList>
              </Card>
            </Section>
            <Section id="docs" size="lg" title="Read more">
              <Cluster gap="sm">
                {tool.links.map((link) => (
                  <Button key={link.href} href={link.href} variant="outline">
                    {link.label}
                  </Button>
                ))}
              </Cluster>
            </Section>
          </Stack>
        </Container>
      </div>
    </>
  );
}
