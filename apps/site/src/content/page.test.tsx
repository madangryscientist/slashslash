import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { DEVELOPER_QUESTIONS } from "#/components/ask";
import { ToggleSlashAccess } from "#/components/tools";
import { FLOW } from "#/content/flow";
import { ADDS, COSTS, HERO, MISSING, STANDS, TODAY, VIEW } from "#/content/landing";
import { PRODUCTS } from "#/content/products";
import { STAGES } from "#/content/stages";
import {
  CONTACT_LINE,
  DEVELOPERS_TITLE,
  LANDING_HEADLINE,
  OG_IMAGE_ALT,
  SITE_NAME,
  TOGGLESLASH_REPO_URL,
} from "#/content/site";

const DIST = resolve(import.meta.dirname, "../../dist");

function read(path: string): string {
  const file = resolve(DIST, path);
  if (!existsSync(file)) throw new Error(`No built page at ${file}. Run "bun run build" first.`);
  return readFileSync(file, "utf8");
}

const built = (): string => read("index.html");
const withoutScripts = (html: string): string => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, " ");
/** HTML escapes React writes for quotes, undone so copy can be matched as written. */
const unescape = (html: string): string => html.replaceAll("&#x27;", "'").replaceAll("&quot;", '"');

/** The prerendered landing page without the hydration payload, so a match means it is in the markup. */
const markup = (): string => unescape(withoutScripts(built())).replaceAll("<!-- -->", "");
/** The same for /developers. */
const developers = (): string => withoutScripts(read("developers.html"));

/** Visible text only: tags, scripts and styles removed. */
function visibleText(html: string): string {
  return unescape(withoutScripts(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

describe("the landing page carries the agreed copy, in order", () => {
  test("the h1 is the promise, and the title and description follow it", () => {
    const html = built();
    expect(html).toMatch(new RegExp(`<h1 id="promise" class="hero-title">${HERO.title}</h1>`));
    expect(html).toContain(`<title>${SITE_NAME}: ${LANDING_HEADLINE}</title>`);
    expect(html).toContain(`name="description" content="${HERO.lead}"`);
    expect(html).toContain(`property="og:image:alt" content="${OG_IMAGE_ALT}"`);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  test("the five steps, each with its bold lead and its words", () => {
    const html = markup();
    const today = html.slice(html.indexOf('id="how-today"'), html.indexOf('id="missing"'));
    expect(today.match(/class="pipe-step"/g)).toHaveLength(5);
    for (const step of TODAY.steps) expect(today).toContain(`<strong>${step.lead}</strong> ${step.text}`);
    expect(today).toContain(TODAY.card);
    expect(today).toContain(TODAY.customer);
  });

  test("what is missing: the lead, the four things, the close", () => {
    const html = markup();
    expect(html).toContain(MISSING.lead);
    for (const item of MISSING.items) expect(html).toContain(item.text);
    expect(html).toContain(MISSING.close);
  });

  test("what it costs, with no numbers", () => {
    const html = markup();
    expect(html).toContain(COSTS.text);
    for (const step of COSTS.loop) expect(html).toContain(step);
    const costs = visibleText(html.slice(html.indexOf('id="costs"'), html.indexOf('id="adds"')));
    expect(costs).not.toMatch(/\b\d/);
  });

  test("what slashslash adds: the four questions, each with its tool", () => {
    const html = markup();
    expect(html).toContain(ADDS.text);
    expect(html).toContain(ADDS.questionsLead);
    for (const q of ADDS.questions) {
      expect(html).toContain(`<strong>${q.question}</strong> <span class="report-tool">${q.tool}</span>`);
    }
    expect(html).toContain(ADDS.close);
    expect(html.match(/class="report-coming"/g)).toHaveLength(3);
    expect(html).toContain('class="thumb"');
  });

  test("where it stands: the status line, the four chips, the link to /developers", () => {
    const html = markup();
    expect(html).toContain(STANDS.text);
    expect(html).toContain(STANDS.hosted);
    for (const chip of STANDS.chips) {
      const { stage } = PRODUCTS.find((p) => p.name === chip.tool)!;
      const label = STAGES[stage].label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const sentence = STAGES[stage].sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(html).toMatch(new RegExp(`data-chip-for="${chip.tool}"[^>]*>${label}<`));
      expect(html).toMatch(new RegExp(`<li[^>]*><span class="chip-tool">${chip.tool}</span>`));
      // The sentence sits in the same list item as the chip's pill.
      expect(html).toMatch(new RegExp(`<li[^>]*>(?:(?!</li>)[\\s\\S])*data-chip-for="${chip.tool}"(?:(?!</li>)[\\s\\S])*${sentence}</span></li>`));
    }
    expect(html).toMatch(new RegExp(`<a [^>]*href="/developers"[^>]*>${STANDS.developers}</a>`));
  });

  test("the four questions for the reader, and how to answer", () => {
    const html = markup();
    expect(html).toContain(`>${VIEW.title}</h2>`);
    for (const question of VIEW.questions) expect(html).toContain(question);
    expect(visibleText(html)).toContain(CONTACT_LINE);
  });

  test("the sections run in the copy's order", () => {
    const html = markup();
    const order = ["promise", "how-today", "missing", "costs", "adds", "stands", "ask"].map((id) =>
      html.indexOf(`id="${id}"`),
    );
    expect(order.every((at) => at > 0)).toBe(true);
    expect(order.toSorted((a, b) => a - b)).toEqual(order);
  });

});

describe("the landing page is for readers who do not write code", () => {
  test("has no diff markup and no run record", () => {
    const html = markup();
    expect(html).not.toMatch(/class="[^"]*\bdiff\b/);
    expect(html).not.toMatch(/class="[^"]*\bruns\b/);
    expect(visibleText(html)).not.toMatch(/run record/i);
  });

  test("keeps developer words out of the visible text", () => {
    const text = visibleText(built());
    for (const word of ["hunk", "@@", "commit", "diff", "CI", "npm", "Bun", "pull request", "PR"]) {
      expect(text, `"${word}" should not be visible on /`).not.toMatch(
        new RegExp(`(^|[^\\w])${word.replace("@", "\\@")}($|[^\\w])`),
      );
    }
  });

  test("the drawings have text equivalents", () => {
    const html = markup();
    expect(html).toContain(`role="img" aria-label="${HERO.description}"`);
    expect(html.match(/<ol class="pipe-steps" aria-label="[^"]+"/g)).toHaveLength(3);
    expect(html).toContain(`alt="${STANDS.reportAlt}"`);
  });
});

describe("with no JavaScript, or reduced motion, every drawing is finished", () => {
  test("the markup holds every element, none hidden and no inline start state", () => {
    const html = markup();
    expect(html).not.toMatch(/<[^>]*\shidden(=|\s|>)/);
    expect(html).not.toMatch(/style="[^"]*(opacity|visibility|display)/);
    expect(html).not.toMatch(/class="[^"]*\bplayed\b/);
  });

  test("the report opens in a dialog with a close button, closed at first", () => {
    const html = markup();
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toMatch(/<a [^>]*class="report-open"[^>]*href="\/report.png"/);
    expect(html).toMatch(/<dialog[^>]*class="report-dialog"/);
    expect(html).toContain(`>${STANDS.reportClose}</button>`);
    expect(html).not.toMatch(/<dialog[^>]*\sopen/);
  });

  test("every start state and every animation lives inside the no-preference query", () => {
    const all = css();
    const outside = withoutMotionQuery(all);
    expect(all).toMatch(/\.played/);
    expect(outside).not.toMatch(/animation(-name)?:/);
    expect(outside).not.toMatch(/\.played|:not\(\.played\)/);
    expect(outside).not.toMatch(/@keyframes/);
  });

  test("each start state also needs the motion class, which only an allowed motion preference adds", () => {
    const starts = css().match(/[^{}]*:not\(\.played\)[^{}]*\{/g) ?? [];
    expect(starts.length).toBeGreaterThan(5);
    const selectors = starts.flatMap((rule) => rule.replace("{", "").split(","));
    const unguarded = selectors.filter((s) => s.includes(":not(.played)") && !s.trim().startsWith(".motion "));
    expect(unguarded).toEqual([]);
  });
});

describe("the hard lines", () => {
  test("no em dash or en dash on either page", () => {
    for (const html of [built(), read("developers.html")]) expect(html).not.toMatch(/[\u2013\u2014]/);
  });
});

describe("/developers holds the developer detail", () => {
  test("renders the walkthrough, in full", () => {
    const html = developers();
    for (const step of FLOW) {
      expect(html).toContain(`id="${step.id}"`);
      expect(html).toContain(step.title);
      for (const fit of step.fits) expect(html).toContain(fit.text.replaceAll('"', "&quot;"));
    }
  });

  test("renders the install commands, the env and flags sections, and the six questions", () => {
    const html = developers().replaceAll("&#x27;", "'");
    expect(html).toContain("npx @hackcove/pixelslash --live-png a.png --local-png b.png --out out");
    expect(html).toContain("npx @hackcove/pixelslash install-browser");
    expect(html).toContain('id="env"');
    expect(html).toContain('id="flags"');
    expect(html).toContain('id="today"');
    for (const question of DEVELOPER_QUESTIONS) expect(html).toContain(question);
  });

  test("all four tools are there with every paragraph of their summary", () => {
    const html = developers().replaceAll("&#x27;", "'");
    for (const product of PRODUCTS) {
      for (const paragraph of product.summary) expect(html).toContain(paragraph.replaceAll('"', "&quot;"));
    }
  });

  test("keeps its own title and links the brand back to the landing page", () => {
    const html = read("developers.html");
    expect(html).toContain(`<title>${DEVELOPERS_TITLE}</title>`);
    expect(html).toContain(`property="og:title" content="${DEVELOPERS_TITLE}"`);
    expect(html).toContain(`name="twitter:title" content="${DEVELOPERS_TITLE}"`);
    expect(html).toMatch(/<h1[^>]*id="for-developers"/);
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*class="brand-link"|<a [^>]*class="brand-link"[^>]*href="\/"/);
    expect(visibleText(html)).not.toMatch(/run record/i);
  });

  test("no tabs", () => {
    for (const html of [markup(), developers()]) expect(html).not.toMatch(/role="tab/);
  });
});

describe("real and imagined stay apart", () => {
  test("the landing report card and the FS_ table say they are imagined, where they appear", () => {
    expect(markup()).toMatch(/class="report-tag">Example</);
    const html = developers();
    const env = html.slice(html.indexOf('id="env"'), html.indexOf('id="flags"'));
    expect(env).toContain('data-kind="idea"');
    expect(env).toContain("FS_TIMEOUT");
  });

  test("a tool's stage in the walkthrough is the stage in the product data", () => {
    for (const fit of FLOW.flatMap((step) => step.fits)) {
      const product = PRODUCTS.find((p) => p.name === fit.tool);
      expect(fit.stage).toBe(product?.stage);
    }
  });

  test("a planned tool never shows real output", () => {
    const planned = FLOW.flatMap((step) => step.fits).filter((fit) => fit.stage === "planned");
    expect(planned.map((fit) => fit.output?.kind).filter((kind) => kind === "real")).toEqual([]);
  });
});

describe("what the page does not claim", () => {
  test("the name is final", () => {
    const html = built();
    expect(html).toContain('role="img" aria-label="slashslash.build"');
    expect(html).not.toMatch(/working name|toolslash/i);
  });

  test("no privacy claim", () => {
    for (const html of [markup(), developers()])
      expect(html).not.toMatch(/no tracking|no analytics|no cookies|\bprivate\b/i);
  });

  test("no invitation to ask for early access", () => {
    for (const html of [markup(), developers()]) expect(html).not.toMatch(/early access/i);
  });
});

describe("ToggleSlash link", () => {
  test("/developers links the public repository and no longer says not public yet", () => {
    expect(TOGGLESLASH_REPO_URL).toBe("https://github.com/madangryscientist/toggleslash");
    expect(developers()).toContain(`href="${TOGGLESLASH_REPO_URL}"`);
    expect(developers()).not.toContain("Not public yet");
  });

  test("absent when the constant is empty, which says not public yet", () => {
    const html = renderToStaticMarkup(<ToggleSlashAccess url="" />);
    expect(html).not.toContain("href");
    expect(html).toContain("Not public yet");
  });

  test("present once the constant holds a URL", () => {
    const url = "https://example.com/toggleslash";
    const html = renderToStaticMarkup(<ToggleSlashAccess url={url} />);
    expect(html).toContain(`href="${url}"`);
    expect(html).not.toContain("Not public yet");
  });
});

/** The stylesheets the slashslash pages link. The PixelSlash pages' own sheet is theirs, not this site's. */
const css = (): string => {
  const sheets = new Set(
    ["index.html", "developers.html", "404.html"].flatMap((page) =>
      [...readFileSync(resolve(DIST, page), "utf8").matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(
        (m) => m[1] ?? "",
      ),
    ),
  );
  expect(sheets.size).toBeGreaterThan(0);
  return [...sheets].map((sheet) => readFileSync(resolve(DIST, `.${sheet}`), "utf8")).join("\n");
};

/** CSS with every `@media (prefers-reduced-motion: no-preference) { ... }` block cut out, by brace depth. */
function withoutMotionQuery(source: string): string {
  const open = /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{/g;
  let result = "";
  let from = 0;
  for (let match = open.exec(source); match; match = open.exec(source)) {
    result += source.slice(from, match.index);
    let depth = 1;
    let i = match.index + match[0].length;
    for (; i < source.length && depth > 0; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}") depth--;
    }
    from = i;
    open.lastIndex = i;
  }
  return result + source.slice(from);
}

