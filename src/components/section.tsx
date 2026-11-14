import type { ReactNode } from "react";

/**
 * A section: a big heading and an optional lead. The "@@ hunk @@" kicker is a developer-page device, so
 * it shows only when a section passes one; the landing page passes none.
 */
export function Section({
  id,
  hunk,
  title,
  lead,
  children,
  heading: Heading = "h2",
}: {
  id: string;
  hunk?: string | undefined;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  /** The page's own title is an h1; every other section is an h2. */
  heading?: "h1" | "h2";
}): ReactNode {
  return (
    <section className="sec wrap" aria-labelledby={id}>
      {hunk ? <p className="sec-at">@@ {hunk} @@</p> : null}
      <Heading id={id} className="sec-title">
        {title}
      </Heading>
      {lead ? <p className="sec-lead">{lead}</p> : null}
      {children}
    </section>
  );
}
