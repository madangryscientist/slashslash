// oxlint-disable-next-line unicorn/require-module-specifiers -- makes this a module so the augmentation below merges
export {};

declare module "react" {
  interface CSSProperties {
    /** The position of an item in a staggered sequence; CSS multiplies it into a delay. */
    "--i"?: number;
    /** A drawn bar's width, as a percentage string. */
    "--w"?: string;
    /** How far a drawn code line is indented, in steps. */
    "--indent"?: number;
  }
}
