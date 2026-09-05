#!/usr/bin/env node
/** Record completed fixture runs with independent target/version preservation checks. */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const fixture = join(root, "evaluations/fixtures/claims");
const originalPackage = await readFile(join(fixture, "package.json"), "utf8");
const originalConfig = JSON.parse(
  await readFile(join(fixture, "world-config.json"), "utf8"),
);
const specifications = JSON.parse(
  await readFile(join(root, "evaluations/cases.json"), "utf8"),
);
const rows = [];
for (const path of process.argv.slice(2)) {
  const results = JSON.parse(
    await readFile(resolve(path, "results.json"), "utf8"),
  );
  for (const result of results) {
    const scenario = specifications.find((s) => s.id === result.case);
    if (!scenario) throw new Error("Unexpected scenario");
    const project = join(result.output, "project");
    const config = JSON.parse(
      await readFile(join(project, "world-config.json"), "utf8"),
    );
    result.package_preserved =
      originalPackage ===
      (await readFile(join(project, "package.json"), "utf8"));
    result.target_preserved = [
      "app_id",
      "rp_id",
      "action",
      "action_environment",
      "sdk_environment",
    ].every((key) => originalConfig[key] === config[key]);
    result.passed =
      result.process_ok &&
      !!result.answer &&
      result.package_preserved &&
      result.target_preserved &&
      result.unexpected_writes === 0 &&
      (!scenario.read_only || result.unchanged) &&
      (!scenario.forbid_portal || result.portal_calls === 0) &&
      (!scenario.require_portal || result.portal_calls > 0) &&
      (!scenario.grade_claims || result.independent_tests);
    rows.push(result);
  }
}
if (
  rows.length !== specifications.length * 2 ||
  new Set(rows.map((r) => `${r.case}/${r.variant}`)).size !== rows.length
)
  throw new Error(
    "Supply one complete baseline/plugin pair for every scenario.",
  );
const summary = {
  recorded_at: new Date().toISOString(),
  model: "CLI configured default; no model override",
  scope:
    "Offline workflow fixtures; separate adapter and live-installation checks",
  results: rows,
};
await writeFile(
  join(root, "evaluations/results.json"),
  JSON.stringify(summary, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    plugin: rows.filter((r) => r.variant === "plugin" && r.passed).length,
    baseline: rows.filter((r) => r.variant === "baseline" && r.passed).length,
    cases: specifications.length,
  }),
);
