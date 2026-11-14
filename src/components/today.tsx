import { CopyLine, TextLink } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { Section } from "#/components/section";
import {
  PIXELSLASH_COMMAND,
  PIXELSLASH_NPM_URL,
  PIXELSLASH_REPO_URL,
  PIXELSLASH_SITE_URL,
} from "#/content/site";

const DOCS = `${PIXELSLASH_REPO_URL}/blob/main/docs/ci`;

export function Today(): ReactNode {
  return (
    <Section
      id="today"
      hunk="use it today"
      title="PixelSlash can run on your machine today."
      lead="It is open source (MIT), published on npm at a 0.x version, and requires Bun."
    >
      <ol className="today">
        <li>
          <h3>From two existing screenshots</h3>
          <CopyLine text={PIXELSLASH_COMMAND} />
          <p>This writes the report to out/report.html.</p>
        </li>
        <li>
          <h3>From two running versions of a page</h3>
          <CopyLine text="npx @hackcove/pixelslash install-browser" />
          <CopyLine text="npx @hackcove/pixelslash --live http://localhost:3000 --local http://localhost:3001 --out out" />
          <p>The first command runs once and fetches the browser that takes the screenshots.</p>
        </li>
        <li>
          <h3>In your own pipeline</h3>
          <p>
            The{" "}
            <TextLink href={`${DOCS}/github-actions.md`} external>
              GitHub Actions guide
            </TextLink>{" "}
            was tested on GitHub Actions. The{" "}
            <TextLink href={`${DOCS}/any-ci.md`} external>
              guide for any other CI
            </TextLink>{" "}
            was tested as a GitHub Actions step and on a desktop; its CircleCI, GitLab and Jenkins examples
            are not tested on those systems.
          </p>
        </li>
      </ol>
      <p className="tool-links">
        <TextLink href={PIXELSLASH_SITE_URL} external>
          pixelslash.dev
        </TextLink>
        <TextLink href={PIXELSLASH_REPO_URL} external>
          Repository on GitHub
        </TextLink>
        <TextLink href={PIXELSLASH_NPM_URL} external>
          Package on npm
        </TextLink>
      </p>
    </Section>
  );
}
