import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const nycOutputDir = path.join(root, ".nyc_output");
const coverageDir = path.join(root, "coverage");

/**
 * Runs once per `playwright test` invocation. Without this, a stale
 * `.nyc_output/*.json` from a previous run would get merged into the next
 * `nyc report`, inflating or corrupting the coverage numbers it checks.
 */
export default function globalSetup(): void {
  rmSync(nycOutputDir, { recursive: true, force: true });
  rmSync(coverageDir, { recursive: true, force: true });
  mkdirSync(nycOutputDir, { recursive: true });
}
