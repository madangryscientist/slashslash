// Prints the share card list (apps/site/src/content/og.ts) as JSON, for `gen.py --og -`.
import { OG_CARDS } from "../../../apps/site/src/content/og.ts";

console.log(JSON.stringify(OG_CARDS, null, 2));
