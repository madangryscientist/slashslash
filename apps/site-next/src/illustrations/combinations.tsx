import type { ReactNode } from "react";

/**
 * The flags section's drawing, moved from the live page: a cell for each on and off combination of ten
 * flags, numbered by its bits. The lit cells are the true eleven: all flags off (cell 0) and each flag
 * alone (cells 1, 2, 4 ... 512). Its wrapper carries `data-lit`, so the Motion island replays the lit
 * cells while it is in view; the base style is the finished drawing.
 */
const SINGLE_FLAG_RUNS = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512] as const;

export function CombinationGrid(): ReactNode {
  return (
    <svg
      className="combos"
      viewBox="0 0 320 320"
      role="img"
      aria-label="A grid of 1,024 cells, one for each on and off combination of 10 flags. Only 11 cells are lit: all flags off, and each flag on alone."
    >
      <defs>
        <pattern id="combo-cell" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect className="combo-off" x="1" y="1" width="8" height="8" />
        </pattern>
      </defs>
      <rect width="320" height="320" fill="url(#combo-cell)" />
      {SINGLE_FLAG_RUNS.map((cell, i) => (
        <rect
          key={cell}
          className="combo-on"
          x={(cell % 32) * 10 + 1}
          y={Math.floor(cell / 32) * 10 + 1}
          width="8"
          height="8"
          style={{ animationDelay: `${i * 70}ms` }}
        />
      ))}
    </svg>
  );
}
