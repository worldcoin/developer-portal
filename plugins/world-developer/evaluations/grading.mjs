// Deterministic fixture assertions, shared by the runner and result recorder.
export const GRADING_VERSION = 2;
const layers = [
  "documentation",
  "project_configuration",
  "portal_configuration",
  "registration",
  "local_tests",
  "device",
  "live_proof",
  "production_database",
];
const specifications = {
  docs: {
    outcome: "answered",
    assessment: { portal_account_required_for_docs: false },
    verified: ["documentation"],
    unverified: [],
  },
  diagnose: {
    outcome: "diagnosed",
    assessment: {
      project_action: "claim",
      portal_action: "verify-account",
      action_mismatch: true,
    },
    verified: [
      "documentation",
      "project_configuration",
      "portal_configuration",
    ],
    unverified: ["live_proof"],
  },
  claims: {
    outcome: "fixed",
    assessment: { production_database_required: true },
    verified: ["local_tests"],
    unverified: ["production_database"],
  },
  review: {
    outcome: "blocked",
    assessment: {
      ready_for_review: false,
      missing_fields: [
        "support_link",
        "logo_img_url",
        "content_card_image_url",
        "showcase_img_urls",
      ],
      device_tested: false,
    },
    verified: ["portal_configuration"],
    unverified: ["device"],
  },
  resume: {
    outcome: "registered",
    assessment: {
      production_status: "registered",
      staging_status: "registered",
      existing_app_reused: true,
      signer_reused: true,
    },
    verified: ["registration"],
    unverified: ["live_proof"],
  },
};
const textArray = { type: "array", items: { type: "string" } };
export function answerSchema(id) {
  const spec = specifications[id];
  if (!spec) throw new Error("Unknown evaluation case");
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      outcome: {
        type: "string",
        enum: [
          "answered",
          "diagnosed",
          "fixed",
          "blocked",
          "registered",
          "failed",
        ],
      },
      findings: textArray,
      verified_layers: {
        type: "array",
        items: { type: "string", enum: layers },
      },
      unverified_layers: {
        type: "array",
        items: { type: "string", enum: layers },
      },
      assessment: {
        type: "object",
        additionalProperties: false,
        properties: Object.fromEntries(
          Object.entries(spec.assessment).map(([key, value]) => [
            key,
            Array.isArray(value) ? textArray : { type: typeof value },
          ]),
        ),
        required: Object.keys(spec.assessment),
      },
    },
    required: [
      "outcome",
      "findings",
      "verified_layers",
      "unverified_layers",
      "assessment",
    ],
  };
}
const app = "app_0123456789abcdef0123456789abcdef";
const reads = [
  "get_team_context",
  "get_app_config",
  "get_world_id_signing_key",
  "get_world_id_registration_status",
];
function data(call) {
  if (call.result?.isError) return null;
  try {
    return JSON.parse(call.result.content[0].text);
  } catch {
    return null;
  }
}
export function gradeScenario(scenario, row, calls) {
  const spec = specifications[scenario.id];
  const answer = row.answer;
  const failures = [];
  const require = (ok, reason) => {
    if (!ok) failures.push(reason);
  };
  require(row.grading_version === GRADING_VERSION, "obsolete grading version");
  require(row.process_ok && !row.timed_out, "process failed or timed out");
  require(row.package_preserved &&
    row.target_preserved, "package or target changed");
  require(!scenario.read_only || row.unchanged, "read-only project changed");
  require(!calls.some(
    (c) => c.kind === "portal" && !reads.includes(c.name),
  ), "unexpected Portal write");
  require(!scenario.forbid_portal ||
    !calls.some((c) => c.kind === "portal"), "unexpected Portal access");
  const docs = calls.filter(
    (c) =>
      c.kind === "docs" &&
      !c.result?.isError &&
      c.result?.content?.some(
        (v) =>
          typeof v.text === "string" && v.text.includes("evaluation snapshot"),
      ),
  );
  const configs = calls.filter(
    (c) =>
      c.kind === "portal" &&
      c.name === "get_app_config" &&
      c.arguments?.app_id === app &&
      data(c)?.app_id === app,
  );
  if (["docs", "diagnose"].includes(scenario.id))
    require(docs.length > 0, "no documentation evidence");
  if (["diagnose", "review"].includes(scenario.id))
    require(configs.length > 0, "no app-configuration evidence");
  if (scenario.id === "resume") {
    const statuses = calls.filter(
      (c) =>
        c.kind === "portal" &&
        c.name === "get_world_id_registration_status" &&
        c.arguments?.app_id === app,
    );
    const last = data(statuses.at(-1) ?? {});
    require(last?.app_id === app &&
      last.status === "registered" &&
      last.staging_status ===
        "registered", "registration completion not observed");
  }
  require(!!spec && answer?.outcome === spec?.outcome, "incorrect outcome");
  require(Array.isArray(answer?.findings) &&
    answer.findings.length > 0 &&
    answer.findings.every(
      (v) => typeof v === "string" && v.trim(),
    ), "empty or invalid findings");
  const verified = answer?.verified_layers;
  const unverified = answer?.unverified_layers;
  require(Array.isArray(verified) &&
    spec?.verified.every((v) => verified.includes(v)) &&
    verified.every((v) =>
      spec.verified.includes(v),
    ), "unsupported or missing verified layer");
  require(Array.isArray(unverified) &&
    spec?.unverified.every((v) => unverified.includes(v)) &&
    unverified.every(
      (v) =>
        layers.includes(v) &&
        !(Array.isArray(verified) && verified.includes(v)),
    ), "missing or contradictory unverified layer");
  for (const [key, expected] of Object.entries(spec?.assessment ?? {})) {
    const actual = answer?.assessment?.[key];
    require(Array.isArray(expected)
      ? Array.isArray(actual) &&
          JSON.stringify([...actual].sort()) ===
            JSON.stringify([...expected].sort())
      : actual === expected, "incorrect assessment: " + key);
  }
  require(!scenario.grade_claims ||
    row.independent_tests === true, "independent claim tests failed");
  return { passed: failures.length === 0, failures };
}
