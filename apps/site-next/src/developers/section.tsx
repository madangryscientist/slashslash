import { Container, Section } from "@hackcove/ui-react";
import type { ReactNode } from "react";

/**
 * One /developers section: the kit's landing Section in the page's column, its title an h2. The live
 * page's "@@ hunk @@" kicker is the section's overline.
 */
export function DevSection({
  id,
  hunk,
  title,
  lead,
  children,
}: {
  id: string;
  hunk?: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}): ReactNode {
  return (
    <div className="py-12" data-dev-section={id}>
      <Container>
        <Section
          id={id}
          size="lg"
          level={2}
          overline={hunk === undefined ? undefined : `@@ ${hunk} @@`}
          title={title}
          description={lead}
        >
          {children}
        </Section>
      </Container>
    </div>
  );
}
