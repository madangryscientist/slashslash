import { CodeBlock, Cluster, Step, Steps, SubsectionHeading, Text, TextLink } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { PIXELSLASH_COMMAND, PIXELSLASH_NPM_URL, PIXELSLASH_REPO_URL, PIXELSLASH_SITE_URL } from "#content/site";
import { DevSection } from "#next/developers/section";

/* How to run PixelSlash today, each command in a kit CodeBlock with a copy button. The page hydrates this when it scrolls into view. */

const DOCS = `${PIXELSLASH_REPO_URL}/blob/main/docs/ci`;

function Command({ text }: { text: string }): ReactNode {
  return <CodeBlock label="bash" language="bash" lines={[text]} copy />;
}

export function Today(): ReactNode {
  return (
    <DevSection
      id="today"
      hunk="use it today"
      title="PixelSlash can run on your machine today."
      lead="It is open source (MIT), published on npm at a 0.x version, and requires Bun."
    >
      <Steps>
        <Step title={<SubsectionHeading>From two existing screenshots</SubsectionHeading>}>
          <div className="space-y-3">
            <Command text={PIXELSLASH_COMMAND} />
            <Text>This writes the report to out/report.html.</Text>
          </div>
        </Step>
        <Step title={<SubsectionHeading>From two running versions of a page</SubsectionHeading>}>
          <div className="space-y-3">
            <Command text="npx @hackcove/pixelslash install-browser" />
            <Command text="npx @hackcove/pixelslash --live http://localhost:3000 --local http://localhost:3001 --out out" />
            <Text>The first command runs once and fetches the browser that takes the screenshots.</Text>
          </div>
        </Step>
        <Step title={<SubsectionHeading>In your own pipeline</SubsectionHeading>}>
          <Text>
            The{" "}
            <TextLink href={`${DOCS}/github-actions.md`} external>
              GitHub Actions guide
            </TextLink>{" "}
            was tested on GitHub Actions. The{" "}
            <TextLink href={`${DOCS}/any-ci.md`} external>
              guide for any other CI
            </TextLink>{" "}
            was tested as a GitHub Actions step and on a desktop; its CircleCI, GitLab and Jenkins examples are not
            tested on those systems.
          </Text>
        </Step>
      </Steps>
      <Cluster gap="md">
        <TextLink href={PIXELSLASH_SITE_URL} external>
          pixelslash.dev
        </TextLink>
        <TextLink href={PIXELSLASH_REPO_URL} external>
          Repository on GitHub
        </TextLink>
        <TextLink href={PIXELSLASH_NPM_URL} external>
          Package on npm
        </TextLink>
      </Cluster>
    </DevSection>
  );
}
