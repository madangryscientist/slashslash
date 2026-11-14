/**
 * The few values that change when the name or the address changes. Nothing else in the site
 * hard-codes them.
 */
import { HERO } from "#/content/landing";

/** The name, as the page shows it. The address is SITE_URL below. */
export const SITE_NAME = "slashslash.build";

/** The landing page's h1 without its full stop, and the page title, link previews included. */
export const LANDING_HEADLINE = HERO.title.replace(/\.$/, "");

/** The hero's lead, word for word: the description in search results and link previews. */
export const SITE_DESCRIPTION: string = HERO.lead;

/** What public/og.png really shows, for og:image:alt. Change it whenever the image changes. */
export const OG_IMAGE_ALT = `The ${SITE_NAME} logo above the words: ${LANDING_HEADLINE}.`;

/** The title of the /developers page, in the tab and in link previews. */
export const DEVELOPERS_TITLE = `${SITE_NAME}: for developers`;

/** The site's own address with no trailing slash, for the share image's absolute URL. */
export const SITE_URL = "https://slashslash.build";

/** Where a reader gets in touch, as shown at the end of the page. Never an email address or a phone number. */
export const CONTACT_LINE = "Reply to whoever sent you this link.";

export const PIXELSLASH_REPO_URL = "https://github.com/madangryscientist/pixelslash";
export const PIXELSLASH_SITE_URL = "https://pixelslash.dev";
export const PIXELSLASH_NPM_URL = "https://www.npmjs.com/package/@hackcove/pixelslash";
export const PIXELSLASH_COMMAND =
  "npx @hackcove/pixelslash --live-png a.png --local-png b.png --out out";

/**
 * Empty while the ToggleSlash repository is private. Set it to the public URL and a link appears where
 * the tool is presented; nothing else on the page changes.
 */
export const TOGGLESLASH_REPO_URL: string = "";
