import { AppShell, AppShellBrand, Caption, Cluster, ColourSchemeToggle, Tabs, Text, TextLink } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { licenceOf } from "#/content/facts";
import { PRODUCTS } from "#/content/products";
import { LANDING_HEADLINE, PIXELSLASH_SITE_URL, SITE_NAME } from "#/content/site";
import { TRADEMARK } from "#/pixelslash/content/trademark";
import { FooterColumns } from "#/stand-ins/footer-columns";
import { SECTIONS, TOOL_KEYS, markFor, type SectionKey } from "#/shell/sections";

/** A mark beside a name: decoration, so the name alone is read out. */
function Marked({ mark, children }: { mark: string; children: ReactNode }): ReactNode {
  return (
    <Cluster as="span" gap="xs" wrap={false}>
      <img src={mark} alt="" width={16} height={16} />
      {children}
    </Cluster>
  );
}

/** The suite's lockup: its mark and its name, one link home. */
function Lockup(): ReactNode {
  return (
    <AppShellBrand
      href="/"
      logo={<img src={SECTIONS.suite.mark} alt="" width={24} height={24} />}
      label={SITE_NAME}
    />
  );
}

/** Every product with its mark: a tool with a page links there, a planned one says so, any other is named only. */
function productItems(): ReactNode[] {
  return PRODUCTS.map((product) => {
    const key = product.name.toLowerCase();
    const home = key in SECTIONS ? SECTIONS[key as SectionKey].home : product.page;
    const name = <Marked mark={markFor(product.name)}>{product.name}</Marked>;
    if (product.stage === "planned")
      return (
        <Cluster as="span" gap="xs">
          {name}
          <Caption as="span">Planned</Caption>
        </Cluster>
      );
    if (home === undefined) return name;
    return <TextLink href={home}>{name}</TextLink>;
  });
}

/** Each licence with the tools under it, in PRODUCTS order, in each tool's facts file's words. */
function licenceItems(): ReactNode[] {
  const byLicence = new Map<string, string[]>();
  for (const { name, facts } of PRODUCTS) {
    if (facts === undefined) continue;
    const licence = licenceOf(facts);
    byLicence.set(licence, [...(byLicence.get(licence) ?? []), name]);
  }
  return [...byLicence].map(([licence, names]) => (
    <span data-licence={licence}>
      {`${licence}: ${names.join(", ")}`}
    </span>
  ));
}

function Footer(): ReactNode {
  return (
    <FooterColumns
      lead={
        <>
          <Lockup />
          <Text>{LANDING_HEADLINE}.</Text>
        </>
      }
      columns={[
        { title: "Tools", items: productItems() },
        {
          title: "Developers",
          items: [
            <TextLink href="/developers">How it works in CI</TextLink>,
            <TextLink href={`${PIXELSLASH_SITE_URL}/docs`} external>
              PixelSlash docs
            </TextLink>,
            <TextLink href="https://github.com/slashsuite" external>
              Source on GitHub
            </TextLink>,
          ],
        },
        { title: "Licence", items: [...licenceItems(), <Text as="span">{TRADEMARK}</Text>] },
      ]}
    />
  );
}

/**
 * The one shell every Slash page sits in: the suite's lockup home, the tool switcher, the controls,
 * then on a tool's page its own pages as a second row, and one footer. Below md the switcher and
 * the second row fold into the kit's Menu. Rendered to static HTML: the theme toggle is wired by
 * the layout's inline script, so the shell hydrates nothing.
 */
export function SlashShell({
  section,
  path,
  children,
}: {
  section: SectionKey;
  /** The page's own path, to mark its sub-nav entry current. */
  path: string;
  children: ReactNode;
}): ReactNode {
  const current = SECTIONS[section];
  const light = current.day;
  const dark = current.night;
  const switcher = (
    <Tabs
      label="Tools"
      items={TOOL_KEYS.map((key) => ({
        label: <Marked mark={SECTIONS[key].mark}>{SECTIONS[key].name}</Marked>,
        href: SECTIONS[key].home,
        selected: key === section,
      }))}
    />
  );
  const subnav =
    current.pages.length > 0 ? (
      <Tabs
        label={current.name}
        items={current.pages.map((page) => ({
          label: page.label,
          href: page.href,
          selected: page.href === path,
          ...("external" in page ? { external: true } : {}),
        }))}
      />
    ) : undefined;
  return (
    <AppShell
      brand={<Lockup />}
      nav={switcher}
      {...(subnav ? { subnav } : {})}
      controls={<ColourSchemeToggle schemes={{ light, dark }} size="sm" data-scheme-toggle="" />}
      footer={<Footer />}
      bleed
    >
      {children}
    </AppShell>
  );
}
