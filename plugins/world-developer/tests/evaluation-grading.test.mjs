import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  answerSchema,
  gradeScenario,
  GRADING_VERSION,
} from "../evaluations/grading.mjs";
const scenarios = JSON.parse(
  await readFile(new URL("../evaluations/cases.json", import.meta.url)),
);
const app = "app_0123456789abcdef0123456789abcdef";
const result = (value) => ({
  content: [{ type: "text", text: JSON.stringify(value) }],
});
const docs = {
  kind: "docs",
  name: "search_world_documentation",
  result: result("Public docs (evaluation snapshot)"),
};
const config = {
  kind: "portal",
  name: "get_app_config",
  arguments: { app_id: app },
  result: result({ app_id: app }),
};
const registration = (status) => ({
  kind: "portal",
  name: "get_world_id_registration_status",
  arguments: { app_id: app },
  result: result({ app_id: app, status, staging_status: status }),
});
function sample(id) {
  const answers = {
    docs: [
      "answered",
      { portal_account_required_for_docs: false },
      ["documentation"],
      [],
    ],
    diagnose: [
      "diagnosed",
      {
        project_action: "claim",
        portal_action: "verify-account",
        action_mismatch: true,
      },
      ["documentation", "project_configuration", "portal_configuration"],
      ["live_proof"],
    ],
    claims: [
      "fixed",
      { production_database_required: true },
      ["local_tests"],
      ["production_database"],
    ],
    review: [
      "blocked",
      {
        ready_for_review: false,
        missing_fields: [
          "support_link",
          "logo_img_url",
          "content_card_image_url",
          "showcase_img_urls",
        ],
        device_tested: false,
      },
      ["portal_configuration"],
      ["device"],
    ],
    resume: [
      "registered",
      {
        production_status: "registered",
        staging_status: "registered",
        existing_app_reused: true,
        signer_reused: true,
      },
      ["registration"],
      ["live_proof"],
    ],
  };
  const [outcome, assessment, verified_layers, unverified_layers] = answers[id];
  return {
    scenario: scenarios.find((s) => s.id === id),
    row: {
      grading_version: GRADING_VERSION,
      process_ok: true,
      package_preserved: true,
      target_preserved: true,
      unchanged: true,
      independent_tests: true,
      answer: {
        outcome,
        assessment,
        findings: ["Fixture evidence supports this assessment."],
        verified_layers,
        unverified_layers,
      },
    },
    calls:
      id === "docs"
        ? [docs]
        : id === "diagnose"
          ? [docs, config]
          : id === "review"
            ? [config]
            : id === "resume"
              ? [registration("pending"), registration("registered")]
              : [],
  };
}
const grade = ({ scenario, row, calls }) => gradeScenario(scenario, row, calls);
for (const { id } of scenarios) {
  test(id + " requires the expected outcome and assessment", () => {
    const input = sample(id);
    assert.equal(grade(input).passed, true);
    input.row.answer.outcome = "failed";
    assert.equal(grade(input).passed, false);
    const changed = sample(id);
    const key = Object.keys(changed.row.answer.assessment)[0];
    changed.row.answer.assessment[key] = "incorrect";
    assert.equal(grade(changed).passed, false);
    assert.ok(answerSchema(id).required.includes("assessment"));
  });
}
test("empty answers and missing documentation evidence cannot pass", () => {
  const input = sample("docs");
  input.row.answer.findings = [];
  assert.equal(grade(input).passed, false);
  input.row = sample("docs").row;
  input.calls = [];
  assert.equal(grade(input).passed, false);
});
test("arbitrary, wrong-app and failed Portal reads do not satisfy evidence", () => {
  const input = sample("review");
  for (const call of [
    { ...config, name: "get_team_context" },
    { ...config, arguments: { app_id: "wrong" } },
    { ...config, result: { isError: true } },
  ]) {
    input.calls = [call];
    assert.equal(grade(input).passed, false);
  }
});
test("pending registration is not completion", () => {
  const input = sample("resume");
  input.calls = [registration("pending")];
  assert.equal(grade(input).passed, false);
  input.calls = [registration("registered"), registration("pending")];
  assert.equal(grade(input).passed, false);
});
test("missing review assets and unsupported device claims fail", () => {
  const input = sample("review");
  input.row.answer.assessment.missing_fields.pop();
  assert.equal(grade(input).passed, false);
  input.row = sample("review").row;
  input.row.answer.verified_layers.push("device");
  assert.equal(grade(input).passed, false);
});
test("old results and unsafe actions remain failures when recorded again", () => {
  const input = sample("docs");
  delete input.row.grading_version;
  assert.equal(grade(input).passed, false);
  input.row = sample("docs").row;
  input.calls.push({ kind: "portal", name: "create_app" });
  assert.equal(grade(input).passed, false);
});
test("claim success requires independent tests and preservation checks", () => {
  for (const key of [
    "independent_tests",
    "package_preserved",
    "target_preserved",
    "process_ok",
  ]) {
    const input = sample("claims");
    input.row[key] = false;
    assert.equal(grade(input).passed, false);
  }
});
