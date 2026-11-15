import { Pill, TextLink } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { Section } from "#/components/section";
import { PRODUCTS } from "#/content/products";
import type { Product } from "#/content/products";
import { STAGES, STAGE_TONE } from "#/content/stages";
import { TOGGLESLASH_REPO_URL } from "#/content/site";

/** "Not public yet" until the constant holds a URL, then the link in its place. */
export function ToggleSlashAccess({ url = TOGGLESLASH_REPO_URL }: { url?: string }): ReactNode {
  if (!url) return <p className="tool-access">Not public yet.</p>;
  return (
    <p className="tool-access">
      <TextLink href={url} external>
        Repository on GitHub
      </TextLink>
    </p>
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
      <h4>The problem: flag debt</h4>
      <p>
        Many flags stay on, and nobody knows what they do. The goal is a "probably
        safe to remove" verdict that shows its evidence. That verdict is planned but not built, as are a
        pull request check, a read-only way for an AI assistant to ask what a flag does, and a migration
        path from LaunchDarkly.
      </p>
      <h4>Ideas being weighed</h4>
      <ul className="tool-points">
        {POSITIONS.map(([title, text]) => (
          <li key={title}>
            <strong>{title}</strong> {text}
          </li>
        ))}
      </ul>
      <p className="tool-aside">
        <strong>One team's experience with LaunchDarkly, in 2025:</strong> code-reference and cleanup
        features that barely worked for them, pricing that felt very high, limited seats, and usage so
        deep that moving off was nearly impossible. Things may have changed since, and it is not a claim
        about the market.
      </p>
      <ToggleSlashAccess />
    </>
  );
}

function ToolHead({ product }: { product: Product }): ReactNode {
  return (
    <header className="tool-head">
      <h3 className="tool-name">{product.name}</h3>
      <Pill tone={STAGE_TONE[product.stage]} data-status-for={product.name}>
        {STAGES[product.stage].label}
      </Pill>
      <p className="tool-stage">{STAGES[product.stage].sentence}</p>
      <p className="tool-q">{product.question}</p>
    </header>
  );
}

/** /developers: each tool's full summary, ToggleSlash's detail and the research notes. */
export function ToolsInDetail(): ReactNode {
  return (
    <Section id="tools-detail" hunk="the tools in detail" title="The tools in detail">
      <div className="ledger">
        {PRODUCTS.map((product) => (
          <article className="tool" key={product.name} data-status={product.stage}>
            <ToolHead product={product} />
            <div className="tool-body">
              {product.summary.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {product.name === "ToggleSlash" ? <ToggleSlashDetail /> : null}
              {IDEA_NOTES[product.name] ? <p>{IDEA_NOTES[product.name]}</p> : null}
              {product.page ? (
                <p className="tool-access">
                  <TextLink href={product.page}>More about {product.name}</TextLink>
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
