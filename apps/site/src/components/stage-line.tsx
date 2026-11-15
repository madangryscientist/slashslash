import type { ReactNode } from "react";
import { type Product, PRODUCTS } from "#/content/products";
import { STAGES } from "#/content/stages";

/** The line under a tool page's heading that says which release stage the tool is in. */
export function StageLine({ name }: { name: Product["name"] }): ReactNode {
  const product = PRODUCTS.find((p) => p.name === name);
  if (!product) throw new Error(`No product named ${name} in PRODUCTS.`);
  const { label, sentence } = STAGES[product.stage];
  return (
    <p className="sec-stage" data-testid="stage">
      <strong>{`${label}.`}</strong> {sentence}
    </p>
  );
}
