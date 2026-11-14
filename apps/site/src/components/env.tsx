import type { ReactNode } from "react";
import { Frame } from "#/components/evidence";
import { Section } from "#/components/section";

type Row = { name: string; staging: string; production: string; differs: boolean };

const ROWS: readonly Row[] = [
  { name: "FS_TIMEOUT", staging: "30s", production: "5s", differs: true },
  { name: "FS_API_URL", staging: "test.example", production: "www.example", differs: true },
  { name: "FS_SHOP_ID", staging: "2", production: "2", differs: false },
  { name: "DB_PASSWORD", staging: "not read", production: "not read", differs: false },
];

export function Env(): ReactNode {
  return (
    <Section
      id="env"
      hunk="environment variables"
      title="How long is the timeout in production?"
      lead="Often nobody can say. The timeout is an environment variable, and these tend to be treated as secrets nobody can read."
    >
      <Frame kind="idea" title="imagined, no tool prints this" className="runs-frame">
        <table className="runs">
          <thead>
            <tr>
              <td />
              <th scope="col" className="runs-head">
                <span className="runs-sub">staging</span>
              </th>
              <th scope="col" className="runs-head">
                <span className="runs-sub">production</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.name} data-differs={row.differs}>
                <th scope="row">
                  <span className="runs-sign" aria-hidden="true">
                    {row.differs ? "~" : " "}
                  </span>
                  {row.name}
                </th>
                <td>{row.staging}</td>
                <td>{row.production}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Frame>
      <p className="runs-note">
        Most of these are not secrets: a URL, a timeout, an ID. The idea is to mark them with an{" "}
        <span className="mono">FS_</span> prefix and show them side by side. Anything shown must not be a
        secret, so a password would never get the prefix or be read.
      </p>
    </Section>
  );
}
