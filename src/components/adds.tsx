import type { ReactNode } from "react";
import { Pipeline } from "#/components/pipeline";
import { Section } from "#/components/section";
import { ADDS } from "#/content/landing";

/** The real report, cropped to its before and after. */
function Thumb(): ReactNode {
  return (
    <span className="thumb">
      <img src="/report.png" alt="Before and after, cropped from the real PixelSlash report" loading="lazy" />
    </span>
  );
}

/** The report a reviewer would see on the change: an illustration, marked Example. */
function ReportCard(): ReactNode {
  return (
    <div className="report">
      <p className="report-tag">{ADDS.example}</p>
      <p className="report-check">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12l5 5 9-10" />
        </svg>
        <span className="report-check-name">{ADDS.checkName}</span>
        <span className="report-check-result">{ADDS.checkResult}</span>
      </p>
      <p className="report-lead">{ADDS.questionsLead}</p>
      <ul className="report-qs">
        {ADDS.questions.map((q, i) => (
          <li key={q.tool} style={{ "--i": i }}>
            <span className="report-q">
              <strong>{q.question}</strong> <span className="report-tool">{q.tool}</span>
            </span>
            {i === 0 ? <Thumb /> : <span className="report-coming">{ADDS.coming}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** What slashslash adds: the same pipeline, the report attached at Approved and Checked, the gap gone. */
export function Adds(): ReactNode {
  const [first] = ADDS.attachedAt;
  return (
    <Section id="adds" title={ADDS.title} lead={ADDS.text}>
      <Pipeline
        variant="adds"
        label="The five steps again, with the report attached at Approved and Checked."
        slots={{ [first]: <ReportCard /> }}
        attached={ADDS.attachedAt}
      />
      <p className="sec-close">{ADDS.close}</p>
    </Section>
  );
}
