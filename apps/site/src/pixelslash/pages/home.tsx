import {
  Button,
  Card,
  CardGrid,
  CodeBlock,
  Container,
  Lead,
  Pill,
  Section,
  Stack,
  Step,
  Steps,
  Text,
  TextLink,
} from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { STAGES, STAGE_TONE } from "#/content/stages";
import { REPO_PUBLIC, REPO_URL } from "#/pixelslash/content/links";
import { STAGE } from "#/pixelslash/content/stage";
import { psHref } from "#/pixelslash/paths";
import { SECTIONS } from "#/shell/sections";
import { SlashDemo } from "#/pixelslash/demo";
import { CentredHero, CentredRow } from "#/stand-ins/centred-hero";

/*
 * The PixelSlash home on the Slash shell: the hero (the PixelSlash lockup, the promise, the stage it
 * is at, the way in), the slash demo, then what it does, on the kit's parts. The copy is the live
 * home's; the art is the theme's.
 */

/** The promise: the page's h1. */
export const PROMISE = "See what your change did to the page.";

/** What the CLI does, each one a section of PixelSlash's docs. */
const FEATURES = [
  {
    title: "Two pages, one diff",
    body: "Shoot Main and Branch with Playwright, or hand it PNGs you already have. It writes a report.html that shows what changed.",
    href: "/how-it-works",
    icon: "capture",
  },
  {
    title: "A perceptual diff",
    body: "Anti-aliasing, faint noise and sub-pixel shifts are told apart from a real change. Our benchmark results are on the How it works page.",
    href: "/how-it-works",
    icon: "diff",
  },
  {
    title: "Many pages",
    body: "Point it at a file of paths and it compares each page. The compare command diffs two snapshot directories.",
    href: "/docs/compare-dirs#comparing-two-snapshot-dirs",
    icon: "baseline",
  },
  {
    title: "Snapshots in CI",
    body: "Every route is shot in a pinned image. Each shot records what rendered it, so one from a different setup is named as such.",
    href: "/docs/capture#snapshot-capture-the-pinned-image",
    icon: "ci",
  },
  {
    title: "A review server",
    body: "Uploading sends shots to a PixelSlash server you run. It holds the build for a person to review and reports a GitHub check.",
    href: "/docs/upload#uploading-to-a-server",
    icon: "self-host",
  },
  {
    title: "A design-system judge",
    body: "Each shot can be checked against your component images by a vision model. With no judge installed, it says so and invents nothing.",
    href: "/docs/judge",
    icon: "review",
  },
] as const;

const STEPS = [
  { title: "Capture", body: "Main and Branch, shot by Playwright once each page has settled." },
  { title: "Diff", body: "A perceptual diff, clustered into regions you can read." },
  { title: "Review", body: "A report.html on your machine, or a build on your own server." },
] as const;

const COMMANDS = [
  "npm i -D @hackcove/pixelslash",
  "npx @hackcove/pixelslash --live-png main.png --local-png branch.png --out out",
  "npx @hackcove/pixelslash install-browser",
] as const;

/** PixelSlash's direction C lockup: its mark and its name. */
function Lockup(): ReactNode {
  const { mark, name } = SECTIONS.pixelslash;
  return (
    <span className="inline-flex items-center gap-2" data-testid="lockup">
      <img src={mark} alt="" width={24} height={24} />
      {name}
    </span>
  );
}

/** The stage PixelSlash is at, as a Pill, and the sentence that says what it means for a user. */
function StageLine(): ReactNode {
  const { label, sentence } = STAGES[STAGE];
  return (
    <p data-testid="stage">
      <Pill tone={STAGE_TONE[STAGE]} dot round>
        {label}
      </Pill>{" "}
      <Text as="span" tone="muted">
        {sentence}
      </Text>
    </p>
  );
}

function Hero(): ReactNode {
  return (
    <div className="hero-ground">
      <Container>
        <Stack gap="xl">
          <div className="pt-12 md:pt-16">
            <CentredHero overline={<Lockup />} title={PROMISE}>
              <StageLine />
              <Lead>
                PixelSlash pixel-diffs Main against Branch and writes a report of what changed. It runs on your
                machine, for free. Source available under the Elastic License 2.0.
              </Lead>
              <CentredRow>
                <Button href={psHref("/self-host")} size="lg">
                  Get started
                </Button>
                <Button href={psHref("/docs")} variant="outline" size="lg">
                  Docs
                </Button>
              </CentredRow>
            </CentredHero>
          </div>
          <SlashDemo />
        </Stack>
      </Container>
    </div>
  );
}

function HowItRuns(): ReactNode {
  return (
    <Section size="lg" title="Three steps, all on your machine">
      <Text>
        PixelSlash runs in place of a hosted visual-review service such as Chromatic, Percy or Argos. It is a
        source-available CLI that needs no Storybook and no account, with no paid plan to buy.{" "}
        <TextLink href={psHref("/compare")}>Where it is still behind</TextLink>.
      </Text>
      <Steps size="lg">
        {STEPS.map((step) => (
          <Step key={step.title} title={step.title}>
            {step.body}
          </Step>
        ))}
      </Steps>
    </Section>
  );
}

function Features(): ReactNode {
  return (
    <Section size="lg" title="What it does">
      <CardGrid columns={3}>
        {FEATURES.map((feature) => (
          <Card key={feature.title} href={psHref(feature.href)} icon={feature.icon} size="lg" title={feature.title}>
            {feature.body}
          </Card>
        ))}
      </CardGrid>
    </Section>
  );
}

function Install(): ReactNode {
  return (
    <Section size="lg" title="Install it from npm">
      <div className="grid items-start gap-10 lg:grid-cols-[2fr_3fr]">
        <Stack gap="sm">
          <Text>
            It is on npm as <code>@hackcove/pixelslash</code>, and the command is <code>pixelslash</code>. The CLI
            runs on <TextLink href="https://bun.sh">Bun</TextLink>, so Bun must be on your PATH; <code>npx</code>{" "}
            starts it. PNG mode needs no browser; for URL capture run <code>install-browser</code> once per machine.
          </Text>
          <Text>
            To run it from a clone instead, <code>bun install</code> and then <code>bun run pixelslash -- …</code> in a
            checkout of {REPO_PUBLIC ? <TextLink href={REPO_URL}>the repository</TextLink> : "the repository"}.
          </Text>
        </Stack>
        <div className="min-w-0">
          <CodeBlock label="bash" language="bash" lines={[...COMMANDS]} overflow="wrap" copy />
        </div>
      </div>
    </Section>
  );
}

function Local(): ReactNode {
  return (
    <Section
      size="lg"
      title="Your pixels stay on your machine."
      description="A page shot leaves the machine only when you ask, and an upload goes only to the server your project names. If a project sets its own AI model, the model gets the three crops of a changed region, never a whole shot."
      actions={
        <>
          <Button href={psHref("/how-it-works")}>How it works</Button>
          <Button href={psHref("/security")} variant="outline">
            Security
          </Button>
        </>
      }
    />
  );
}

export function PixelSlashHome(): ReactNode {
  return (
    <>
      <Hero />
      <div className="py-16">
        <Container>
          <Stack gap="xl">
            <HowItRuns />
            <Features />
            <Install />
            <Local />
          </Stack>
        </Container>
      </div>
    </>
  );
}
