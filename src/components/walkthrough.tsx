import { Pill } from "@hackcove/ui-react";
import type { ReactNode } from "react";
import { Frame } from "#/components/evidence";
import { Section } from "#/components/section";
import { FLOW } from "#/content/flow";
import type { Output } from "#/content/flow";
import { STATUS_TONE } from "#/content/products";

function lineClass(line: string): string {
  if (line.startsWith("$ ")) return "term-cmd";
  return line.startsWith("(") ? "term-note" : "";
}

/** Terminal text. Long lines wrap, so nothing scrolls sideways on a phone. */
function Term({ lines, label }: { lines: readonly string[]; label: string }): ReactNode {
  return (
    <pre className="term" aria-label={label}>
      {lines.map((line, i) => (
        <span
          // Lines repeat in real output; their place in the list is their identity.
          key={i}
          className={lineClass(line)}
        >
          {line}
          {"\n"}
        </span>
      ))}
    </pre>
  );
}

function Artefact({ output, tool }: { output: Output; tool: string }): ReactNode {
  return (
    <Frame kind={output.kind} title={output.title}>
      {output.lines ? <Term lines={output.lines} label={`${tool} output`} /> : null}
      {output.image ? (
        <img
          className="shot"
          src={output.image.src}
          width={output.image.width}
          height={output.image.height}
          alt={output.image.alt}
        />
      ) : null}
    </Frame>
  );
}

export function Walkthrough(): ReactNode {
  return (
    <Section
      id="walkthrough"
      hunk="the life of one feature"
      title="One feature goes from ticket to cleanup."
      lead="Solid frames hold real output or text from a tool's docs. Dashed frames are imagined."
    >
      <ol className="rail">
        {FLOW.map((step, i) => (
          <li key={step.id} id={step.id} className="stop" data-lit>
            <span className="stop-n mono" aria-hidden="true">{`0${i + 1}`}</span>
            <p className="stop-label mono">{step.label}</p>
            <h3 className="stop-title">{step.title}</h3>
            <p className="stop-story">{step.story}</p>
            <div className="fits">
              {step.fits.map((fit) => (
                <div className="fit" key={fit.tool}>
                  <div className="fit-text">
                    <h4 className="fit-tool">
                      {fit.tool} <Pill tone={STATUS_TONE[fit.status]}>{fit.status}</Pill>
                    </h4>
                    <p>{fit.text}</p>
                  </div>
                  {fit.output ? <Artefact output={fit.output} tool={fit.tool} /> : null}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
