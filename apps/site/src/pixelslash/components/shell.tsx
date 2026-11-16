import {
  AppShell,
  AppShellBrand,
  Button,
  Caption,
  ColourSchemeToggle,
  Container,
  Tabs,
  TextLink,
} from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { TRADEMARK } from "#ps/content/trademark";
import { APP_LIVE, APP_URL, CONTACT, REPO_PUBLIC, REPO_URL } from "#ps/content/links";
import { PAGES } from "#ps/content/pages";
import { STAGE_LINE } from "#ps/content/stage";
import { Wordmark } from "#ps/components/logo";
import { psHref } from "#ps/paths";
import { SCHEMES } from "#ps/schemes";


/** Where the source is: a link once the repository is public (PS-257, PS-292), a plain sentence before. */
function SourceLink(): ReactNode {
  if (!REPO_PUBLIC) return <Caption as="span" data-testid="source-status">Source opens at launch</Caption>;
  return (
    <TextLink href={REPO_URL} external data-testid="source-status">
      GitHub
    </TextLink>
  );
}

function Controls(): ReactNode {
  return (
    <>
      <ColourSchemeToggle schemes={SCHEMES} size="sm" data-testid="theme-toggle" />
      {APP_LIVE && (
        <Button href={APP_URL} variant="outline" size="sm">
          Sign in
        </Button>
      )}
      <Button href={psHref("/self-host")} size="sm">
        Get started
      </Button>
    </>
  );
}

/** The footer every page shares: the wordmark, the stage, the licence and contact lines, then the trademark line. */
export function Footer(): ReactNode {
  return (
    <div data-testid="footer" className="home-footer flex flex-col gap-4 py-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <a href={psHref("/")} className="flex items-center" aria-label="PixelSlash home">
          <Wordmark />
        </a>
        <Caption as="span" data-testid="stage-footer">{STAGE_LINE}</Caption>
        <span>Elastic License 2.0</span>
        <TextLink href={`mailto:${CONTACT}`}>{CONTACT}</TextLink>
        <SourceLink />
      </div>
      <span data-testid="trademark">{TRADEMARK}</span>
    </div>
  );
}

/**
 * An inner page's ground: the home's canvas with the same aurora and grid fading out over the top
 * of the page, so stepping from the home to any page keeps the look. The page itself sits in the
 * shell's own Container, over it.
 */
function PageArt({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="page-art">
      <div className="page-art-bg" aria-hidden="true">
        <div className="home-aurora">
          <span />
          <span />
          <span />
        </div>
        <div className="home-grid" />
      </div>
      <div className="py-8">
        <Container>{children}</Container>
      </div>
    </div>
  );
}

/**
 * The frame every page sits in: the brand, the nav, the page, the footer. The homepage's sections
 * run the full width. Every other page is drawn over the same ground (PageArt), and the shell
 * paints that ground under the footer too. The footer is the same on every page. `pathname` is the
 * page's path on pixelslash.dev (`/pricing`), so the nav compares like with like; every link goes
 * through psHref, which points it here or at pixelslash.dev.
 */
export function Shell({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}): ReactNode {
  const isHome = pathname === "/";
  const items = PAGES.map((page) => ({
    label: page.label,
    href: psHref(page.to),
    // Marks the Home tab for the stylesheet, which hides it from md to lg without naming its address.
    ...(page.to === "/" ? { "data-home": "" } : {}),
    // A docs page (`/docs/upload`) keeps Docs marked in the nav.
    active: page.to === pathname || (page.to !== "/" && pathname.startsWith(`${page.to}/`)),
  }));
  return (
    <AppShell
      brand={<AppShellBrand href={psHref("/")} label={<Wordmark />} />}
      controls={<Controls />}
      // One row from md: the nav sits between the brand and the controls. On a phone AppShell folds it
      // behind its Menu button; the controls stay in the header.
      nav={<Tabs items={items} label="Site" data-testid="site-nav" />}
      footer={<Footer />}
      bleed
      data-art=""
    >
      {isHome ? children : <PageArt>{children}</PageArt>}
    </AppShell>
  );
}
