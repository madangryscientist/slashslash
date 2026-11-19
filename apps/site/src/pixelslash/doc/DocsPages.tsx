import {
  Breadcrumbs,
  Button,
  Callout,
  Card,
  CardGrid,
  Overline,
  ProseLayout,
  Stack,
  Text,
  TextLink,
} from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { OnThisPage } from "#/pixelslash/doc/DocPage";
import { DocsGroupGrid } from "#/pixelslash/doc/DocsGroups";
import { CLI_INTRO_DOC, docFor } from "#/pixelslash/doc/docs-content";
import { type DocPageDef, EXTRA_NAV, GROUPS, LISTED_PAGES, findPage, neighbours } from "#/pixelslash/doc/docs-map";
import { DocBody } from "#/pixelslash/doc/markdown";
import { DOCS, REPO_URL } from "#/pixelslash/doc/resolve-links";

/*
 * PixelSlash's docs pages, ported from its site onto the Slash shell. These pages load no script, so
 * the nav is every group's links in full (no fold), and there is no search box yet.
 */

const pageHref = (page: DocPageDef): string => `${DOCS}/${page.slug}`;

/** The nav's links in one group: the map's pages, then the site pages that sit in the same group. */
function groupItems(groupId: string, current: string | undefined): { label: string; href: string; active: boolean }[] {
  return [
    ...LISTED_PAGES.filter((page) => page.group === groupId).map((page) => ({
      label: page.title,
      href: pageHref(page),
      active: page.slug === current,
    })),
    ...EXTRA_NAV.filter((extra) => extra.group === groupId).map((extra) => ({
      label: extra.title,
      href: extra.href,
      active: false,
    })),
  ];
}

/** The docs nav: a link to the landing, then each group's title over its pages. `current` is the page's slug. */
export function DocsNav({ current }: { current?: string }): ReactNode {
  return (
    <nav aria-label="Docs" data-testid="docs-nav">
      <Stack gap="md">
        <TextLink href={DOCS} {...(current === undefined ? { "aria-current": "page" as const } : {})}>
          All docs
        </TextLink>
        {GROUPS.map((group) => (
          <Stack key={group.id} gap="xs" data-testid={`docs-group-${group.id}`}>
            <Overline>{group.title}</Overline>
            <ul className="flex flex-col gap-1 text-sm/6">
              {groupItems(group.id, current).map((item) => (
                <li key={item.href}>
                  <TextLink href={item.href} {...(item.active ? { "aria-current": "page" as const } : {})}>
                    {item.label}
                  </TextLink>
                </li>
              ))}
            </ul>
          </Stack>
        ))}
      </Stack>
    </nav>
  );
}

/** A page that can end a run non-zero says where the numbers are explained. */
function ExitsLine(): ReactNode {
  return (
    <Text as="p" data-testid="docs-exits">
      This command can end with a non-zero exit code. <TextLink href={`${DOCS}/exit-codes`}>Exit codes</TextLink> says
      what each number means.
    </Text>
  );
}

/** The file a page is cut from, on GitHub. */
export function EditLink({ source }: { source: string }): ReactNode {
  return (
    <Text as="p" data-testid="docs-edit">
      <TextLink href={`${REPO_URL}/blob/main/${source}`} external>
        Edit this page on GitHub
      </TextLink>
    </Text>
  );
}

function PrevNext({ slug }: { slug: string }): ReactNode {
  const { prev, next } = neighbours(slug);
  if (!prev && !next) return null;
  const card = (page: DocPageDef, word: string, testid: string): ReactNode => (
    <Card href={pageHref(page)} title={`${word}: ${page.title}`} size="sm" data-testid={testid}>
      {GROUPS.find((group) => group.id === page.group)?.title}
    </Card>
  );
  return (
    <nav aria-label="Previous and next" data-testid="docs-prev-next">
      <CardGrid columns={2}>
        {prev ? card(prev, "Previous", "docs-prev") : <div />}
        {next ? card(next, "Next", "docs-next") : <div />}
      </CardGrid>
    </nav>
  );
}

/** The nav beside the page from `lg`; below it, after the page, so the text comes first on a phone. */
function WithNav({ current, children }: { current?: string; children: ReactNode }): ReactNode {
  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <div className="min-w-0 lg:order-2">{children}</div>
      <div className="min-w-0 lg:order-1">
        <DocsNav {...(current === undefined ? {} : { current })} />
      </div>
    </div>
  );
}

/** One page of the docs: a cut of docs/cli.md, or a file of its own, rendered at build time. */
export function DocsPage({ slug }: { slug: string }): ReactNode {
  const page = findPage(slug);
  if (page === undefined) throw new Error(`docs: no page ${slug}`);
  const doc = docFor(slug);
  const group = GROUPS.find((candidate) => candidate.id === page.group);
  const breadcrumbs = <Breadcrumbs items={[{ label: "Docs", href: DOCS }, group?.title ?? "", page.title]} />;
  return (
    <WithNav current={slug}>
      <ProseLayout title={page.title} breadcrumbs={breadcrumbs} gap="lg">
        {doc.headings.some((heading) => heading.depth <= 3) ? <OnThisPage doc={doc} /> : null}
        <div data-testid="docs-article">
          <DocBody doc={doc} />
        </div>
        {page.exits === true ? <ExitsLine /> : null}
        <EditLink source={doc.source} />
        <PrevNext slug={slug} />
      </ProseLayout>
    </WithNav>
  );
}

/** Where a reader who has never run PixelSlash starts. */
const FIRST_STEP = {
  slug: "getting-started",
  action: "Run a first compare",
  text: "Install PixelSlash, compare two versions of a page and read the report. About fifteen minutes, all on your machine.",
} as const;

/** `/pixelslash/docs`: one first step, the lead of docs/cli.md, then every group. */
export function DocsIndexPage(): ReactNode {
  const first = findPage(FIRST_STEP.slug);
  if (first === undefined) throw new Error(`docs: no page ${FIRST_STEP.slug}`);
  return (
    <ProseLayout
      width="full"
      title="Docs"
      description="Install PixelSlash, run a first compare, then look up whatever you are doing next."
    >
      <Callout
        tone="neutral"
        title="New here? Start with the first compare"
        actions={
          <Button href={pageHref(first)} data-testid="docs-first-step">
            {FIRST_STEP.action}
          </Button>
        }
        data-testid="docs-start"
      >
        {FIRST_STEP.text}
      </Callout>
      <div className="max-w-[75ch]" data-testid="docs-intro">
        <DocBody doc={CLI_INTRO_DOC} />
      </div>
      <DocsGroupGrid />
    </ProseLayout>
  );
}
