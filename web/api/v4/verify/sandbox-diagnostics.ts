import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

type Stage =
  | "request_validated"
  | "graphql_client"
  | "rp_registration"
  | "integrity_verification"
  | "session_verification"
  | "uniqueness_verification";

type GuardFailureStage =
  | "protocol_version_guard"
  | "rp_status_guard"
  | "app_status_guard"
  | "selfie_integrity_requirement";

type RequestSummary = {
  protocol_version: string;
  action?: string;
  proof_count: number;
  credential_types: string[];
  integrity_bundle_present: boolean;
  session_proof: boolean;
};

const SAFE_LABEL = /^[a-zA-Z0-9_-]{1,64}$/;
const ID_PATTERN = /^(?:app_[0-9a-f]{32}|rp_[0-9a-f]{16})$/;

function safeLabel(value: unknown): string | undefined {
  return typeof value === "string" && SAFE_LABEL.test(value)
    ? value
    : undefined;
}

function requestSummary(value: unknown): RequestSummary {
  const request = value as {
    protocol_version: string;
    action?: unknown;
    session_id?: unknown;
    integrity_bundle?: unknown;
    responses: Array<{ identifier?: unknown }>;
  };
  const credentialTypes = request.responses
    .slice(0, 10)
    .map((response) => safeLabel(response.identifier))
    .filter((identifier): identifier is string => identifier !== undefined);

  return {
    protocol_version: request.protocol_version,
    action: safeLabel(request.action),
    proof_count: request.responses.length,
    credential_types: [...new Set(credentialTypes)].slice(0, 10),
    integrity_bundle_present: request.integrity_bundle !== undefined,
    session_proof: request.session_id !== undefined,
  };
}

/**
 * Disabled unless the server deployment explicitly enables Sandbox diagnostics.
 * No proof, nonce, token, or raw body is ever passed to the logger.
 */
export class SandboxVerifyDiagnostics {
  private readonly startedAt = Date.now();
  private attemptId?: string;
  private routeId?: string;
  private summary?: RequestSummary;
  private failureStage?: GuardFailureStage;
  private stages: Array<{
    stage: Stage;
    elapsed_ms: number;
    duration_ms?: number;
  }> = [];

  start(routeId: string, request: unknown): void {
    const environment =
      request && typeof request === "object" && "environment" in request
        ? request.environment
        : undefined;
    if (
      process.env.SANDBOX_VERIFY_DIAGNOSTICS_ENABLED !== "true" ||
      environment !== "sandbox"
    ) {
      return;
    }

    try {
      this.summary = requestSummary(request);
      this.attemptId = randomUUID();
    } catch {
      console.error("Failed to initialize Sandbox verification diagnostic");
      return;
    }
    this.routeId = routeId;
    this.mark("request_validated");
  }

  mark(stage: Stage): void {
    if (!this.routeId) return;
    const elapsed = Date.now() - this.startedAt;
    const previous = this.stages.at(-1);
    if (previous) previous.duration_ms = elapsed - previous.elapsed_ms;
    this.stages.push({ stage, elapsed_ms: elapsed });
  }

  failGuard(stage: GuardFailureStage): void {
    if (this.routeId) this.failureStage = stage;
  }

  async finish(response: NextResponse): Promise<void> {
    if (!this.routeId) return;
    const duration = Date.now() - this.startedAt;
    const lastStage = this.stages.at(-1);
    if (lastStage) lastStage.duration_ms = duration - lastStage.elapsed_ms;

    let code: string | undefined;
    let success: boolean | undefined;
    let resultCount: number | undefined;
    let failedResultCount: number | undefined;
    let results:
      | Array<{ identifier?: string; success?: boolean; code?: string }>
      | undefined;
    try {
      const body: unknown = await response.clone().json();
      if (body && typeof body === "object") {
        if ("code" in body) code = safeLabel(body.code);
        if ("success" in body && typeof body.success === "boolean") {
          success = body.success;
        }
        if ("results" in body && Array.isArray(body.results)) {
          resultCount = body.results.length;
          failedResultCount = body.results.reduce(
            (count: number, result: unknown) =>
              count +
              (result &&
              typeof result === "object" &&
              "success" in result &&
              result.success === false
                ? 1
                : 0),
            0,
          );
          results = body.results.slice(0, 10).map((result: unknown) => {
            if (!result || typeof result !== "object") return {};
            return {
              identifier:
                "identifier" in result
                  ? safeLabel(result.identifier)
                  : undefined,
              success:
                "success" in result && typeof result.success === "boolean"
                  ? result.success
                  : undefined,
              code: "code" in result ? safeLabel(result.code) : undefined,
            };
          });
        }
      }
    } catch {
      // A non-JSON response still has a status and the recorded stages.
    }

    try {
      await logger.info("Sandbox verification diagnostic", {
        attempt_id: this.attemptId,
        environment: "sandbox",
        app_or_rp_id: ID_PATTERN.test(this.routeId) ? this.routeId : undefined,
        request: this.summary,
        stages: this.stages,
        response: {
          status: response.status,
          success,
          code,
          result_count: resultCount,
          failed_result_count: failedResultCount,
          results,
          failure_stage:
            response.status >= 400
              ? this.failureStage ?? this.stages.at(-1)?.stage
              : undefined,
          duration_ms: duration,
        },
      });
    } catch {
      // Diagnostics must not change the verifier response or fall back to raw logging.
      console.error("Failed to emit Sandbox verification diagnostic");
    }
  }
}
