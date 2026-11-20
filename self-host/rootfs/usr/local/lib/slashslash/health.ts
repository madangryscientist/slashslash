/**
 * Asks each product through Caddy, the way a person reaches it. Exit 0 only when both answer:
 * PixelSlash's `/` under 500 and ToggleSlash's `/health` a 200. `--print` writes one line per
 * product, for `slashslash status`.
 */
const checks = [
  { name: "pixelslash", url: `http://127.0.0.1:${process.env["PIXELSLASH_PORT"] || 3000}/`, ok: (s: number) => s < 500 },
  { name: "toggleslash", url: `http://127.0.0.1:${process.env["TOGGLESLASH_PORT"] || 8080}/health`, ok: (s: number) => s === 200 },
];

const results = await Promise.all(
  checks.map(async ({ name, url, ok }) => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      return { name, url, healthy: ok(response.status), said: `HTTP ${response.status}` };
    } catch (error) {
      return { name, url, healthy: false, said: error instanceof Error ? error.message : String(error) };
    }
  }),
);
if (process.argv.includes("--print"))
  for (const r of results) console.log(`${r.name.padEnd(12)} ${r.healthy ? "healthy" : "unhealthy"} (${r.url}: ${r.said})`);
process.exit(results.every((r) => r.healthy) ? 0 : 1);
