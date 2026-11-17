import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { PRODUCTS } from "#/content/products";
import { TASKSLASH_REPO_URL } from "#/content/site";
import { TRY_IT, WORKS_TODAY } from "#/content/taskslash";

/** taskslash's README.md at the commit content/taskslash.ts was written from, kept beside it. */
const README = readFileSync(resolve(import.meta.dirname, "taskslash-readme.md"), "utf8");

describe("the /taskslash content", () => {
  test("every command it says works today is in taskslash's README, as the README writes it", () => {
    for (const feature of WORKS_TODAY) expect(README, feature.title).toContain(feature.command);
  });

  test("every try-it command is in the README, bar the clone and the cd that the repository URL makes", () => {
    const clone = [`git clone ${TASKSLASH_REPO_URL}`, "cd taskslash"];
    for (const command of TRY_IT.steps.flatMap((step) => step.commands)) {
      if (clone.includes(command)) continue;
      expect(README, command).toContain(command);
    }
  });

  test("says plainly that it needs Linux and a systemd user session to measure", () => {
    expect(TRY_IT.lead).toMatch(/Linux/);
    expect(TRY_IT.lead).toMatch(/systemd user session/);
  });

  test("its PRODUCTS entry is the approved line, word for word", () => {
    expect(PRODUCTS.find((product) => product.name === "TaskSlash")).toEqual({
      name: "TaskSlash",
      stage: "alpha",
      licence: "MIT",
      question: "Why did the tests time out?",
      summary: [
        "It queues builds and tests on one machine, so a test fails because of the code, not because everything ran at once.",
        "It is being built now. Its source is public under the MIT license. Today it is a daemon and a command line for Linux that run each job in its own systemd scope, measure what it cost, and start a job only when it fits in the room the machine has left. A release you can install is planned.",
      ],
      page: "/taskslash",
    });
  });
});
