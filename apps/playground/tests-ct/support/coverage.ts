import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test as base, expect } from "@playwright/experimental-ct-react";

declare global {
  interface Window {
    __coverage__?: unknown;
  }
}

const outputDir = path.resolve(import.meta.dirname, "../../.nyc_output");

/**
 * Every spec file must import `test`/`expect` from here rather than directly
 * from `@playwright/experimental-ct-react`, or that file's coverage is
 * silently never collected — `vite-plugin-istanbul` populates
 * `window.__coverage__` in the mounted page, but nothing drains it into
 * `.nyc_output/` without this fixture.
 */
export const test = base.extend({
  page: async ({ page }, runTest, testInfo) => {
    await runTest(page);

    if (process.env.VITE_COVERAGE !== "true") {
      return;
    }

    const coverage = await page.evaluate<unknown>(() => window.__coverage__);
    if (coverage === undefined) {
      return;
    }

    mkdirSync(outputDir, { recursive: true });
    writeFileSync(
      path.join(outputDir, `${testInfo.testId}.json`),
      JSON.stringify(coverage),
    );
  },
});

export { expect };
