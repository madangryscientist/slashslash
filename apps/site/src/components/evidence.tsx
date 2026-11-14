import { Pill } from "@hackcove/ui-react";
import type { ReactNode } from "react";

/**
 * What the reader is looking at, shown the same way everywhere: solid frames for output that exists,
 * dashed and hatched for anything imagined, and the words saying which on every one.
 */
type EvidenceKind = "real" | "quoted" | "made-up" | "idea";

const TAGS: Record<Exclude<EvidenceKind, "idea">, string> = {
  real: "Real output, captured by running it",
  quoted: "Printed in its docs, not re-run here",
  "made-up": "Made up",
};

export function IdeaPill(): ReactNode {
  return <Pill tone="slate">Planned</Pill>;
}

export function Frame({
  kind,
  title,
  tag,
  children,
  className,
}: {
  kind: EvidenceKind;
  title?: string;
  /** Replaces the standard words when the label needs to say more. */
  tag?: string;
  children: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <figure className={className ? `frame ${className}` : "frame"} data-kind={kind}>
      <figcaption className="frame-head">
        {kind === "idea" ? <IdeaPill /> : <span className="frame-tag">{tag ?? TAGS[kind]}</span>}
        {title ? <span className="frame-title">{title}</span> : null}
      </figcaption>
      {children}
    </figure>
  );
}
