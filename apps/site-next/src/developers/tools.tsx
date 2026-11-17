import { BulletItem, BulletList, Card, CardGrid, Pill, Stack, SubsectionHeading, Text, TextLink } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { PRODUCTS, type Product } from "#content/products";
import { TOGGLESLASH_REPO_URL } from "#content/site";
import { STAGES, STAGE_TONE } from "#content/stages";
import { DevSection } from "#next/developers/section";

/** "Not public yet" until the constant holds a URL, then the link in its place. */
function ToggleSlashAccess({ url = TOGGLESLASH_REPO_URL }: { url?: string }): ReactNode {
  if (!url) return <Text>Not public yet.</Text>;
  return (
    <Text>
      <TextLink href={url} external>
        Repository on GitHub
      </TextLink>
    </Text>
  );
}

const POSITIONS: readonly [string, string][] = [
  ["No per-seat pricing.", "How a hosted version would charge is undecided."],
  ["Migration as a core feature.", "ToggleSlash would offer import, side-by-side running and full export from day one."],
  ["A free read-only way in.", "The analysis could read an existing flag service, with no migration."],
];

const IDEA_NOTES: Partial<Record<Product["name"], string>> = {
  BundleSlash:
    "Research so far is light and no tool has been tried. RelativeCI, Codecov Bundle Analysis and BundleMon are hosted, and bundle-stats is the closest open source tool found. It is not yet known whether there is room for one more.",
  FlakeSlash:
    "Research so far is light and relies on vendors' own descriptions. Trunk Flaky Tests, Buildkite Test Engine, Mergify CI Insights, BuildPulse and Datadog Test Optimization exist, and the open source options found are small. It is not yet known whether there is room for one more.",
};

function ToggleSlashDetail(): ReactNode {
  return (
    <>
      <SubsectionHeading as="h4" size="sm">
        The problem: flag debt
      </SubsectionHeading>
      <Text>
        Many flags stay on, and nobody knows what they do. The goal is a "probably safe to remove" verdict that shows
        its evidence. That verdict is planned but not built, as are a pull request check, a read-only way for an AI
        assistant to ask what a flag does, and a migration path from LaunchDarkly.
      </Text>
      <SubsectionHeading as="h4" size="sm">
        Ideas being weighed
      </SubsectionHeading>
      <BulletList>
        {POSITIONS.map(([title, text]) => (
          <BulletItem key={title}>
            <strong>{title}</strong> {text}
          </BulletItem>
        ))}
      </BulletList>
      <Text tone="muted">
        <strong>One team's experience with LaunchDarkly, in 2025:</strong> code-reference and cleanup features that
        barely worked for them, pricing that felt very high, limited seats, and usage so deep that moving off was nearly
        impossible. Things may have changed since, and it is not a claim about the market.
      </Text>
      <ToggleSlashAccess />
    </>
  );
}

/** /developers: a card per tool with its full summary, ToggleSlash's detail and the research notes. */
export function ToolsInDetail(): ReactNode {
  return (
    <DevSection id="tools-detail" hunk="the tools in detail" title="The tools in detail">
      <CardGrid columns={2} align="start">
        {PRODUCTS.map((product) => (
          <Card
            key={product.name}
            as="article"
            size="lg"
            title={product.name}
            titleStyle="name"
            data-status={product.stage}
            status={
              <Pill tone={STAGE_TONE[product.stage]} dot round data-status-for={product.name}>
                {STAGES[product.stage].label}
              </Pill>
            }
          >
            <Stack gap="sm">
              <Text tone="muted">{STAGES[product.stage].sentence}</Text>
              <Text strong>{product.question}</Text>
              {product.summary.map((paragraph) => (
                <Text key={paragraph}>{paragraph}</Text>
              ))}
              {product.name === "ToggleSlash" ? <ToggleSlashDetail /> : null}
              {IDEA_NOTES[product.name] ? <Text>{IDEA_NOTES[product.name]}</Text> : null}
              {product.page ? (
                <Text>
                  <TextLink href={product.page}>More about {product.name}</TextLink>
                </Text>
              ) : null}
            </Stack>
          </Card>
        ))}
      </CardGrid>
    </DevSection>
  );
}
