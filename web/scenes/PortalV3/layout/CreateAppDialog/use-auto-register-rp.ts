import { getGraphQLErrorCode } from "@/lib/errors";
import { useRegisterRpMutation } from "@/scenes/common/layout/CreateAppDialog/client/register-rp.generated";
import { Wallet } from "ethers";
import posthog from "posthog-js";
import { useCallback, useState } from "react";

export type AutoRegisterStatus =
  | "idle"
  | "registering"
  | "key-ready"
  | "failed";

// Generates a managed signer key and registers the RP for an app. Shared by
// the create-app dialog (auto-run right after create) and the dashboard
// setup strip (manual retry on an already-created app) — same hardened
// sequence, same idempotency guarantees, in one place.
export const useAutoRegisterRp = () => {
  const [registerRp] = useRegisterRpMutation();

  const [status, setStatus] = useState<AutoRegisterStatus>("idle");
  // Kept only in memory, shown once on the key-ready step. Never logged,
  // never sent to posthog — only the derived address leaves the client.
  const [signerKey, setSignerKey] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Runs automatically after create, and again from "Retry registration" —
  // reuses the already-generated key on retry so a retry after a lost
  // response re-sends the SAME signer_address instead of orphaning the
  // first key.
  const run = useCallback(
    async (appId: string) => {
      setError(null);
      setStatus("registering");

      const key = signerKey ?? Wallet.createRandom();
      if (!signerKey) {
        setSignerKey({ address: key.address, privateKey: key.privateKey });
      }

      // Browser fetch has no `timeout` init — Apollo just spreads fetchOptions
      // into the fetch call, so a plain `timeout: 30000` field is a silent
      // no-op. Bind it for real with AbortController (same pattern as
      // `fetchWithTimeout` in web/lib/utils.ts): an abort rejects the
      // mutation, which the existing catch below routes to "failed" (Retry +
      // Continue exits) instead of trapping the user on the spinner.
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 30_000);

      try {
        const { data } = await registerRp({
          variables: {
            app_id: appId,
            mode: "managed",
            signer_address: key.address,
          },
          context: {
            fetchOptions: {
              signal: timeoutController.signal,
            },
          },
        });

        if (!data?.register_rp?.rp_id) {
          posthog.capture("v3_auto_rp_failed", {
            app_id: appId,
            detail: "register_rp returned no rp_id",
          });
          setError("Registration did not return a confirmation.");
          setStatus("failed");
          return;
        }

        posthog.capture("v3_auto_rp_registered", { app_id: appId });
        setStatus("key-ready");
      } catch (err) {
        const code = getGraphQLErrorCode(err);

        if (code === "already_registered") {
          // Idempotent — treat as success (same precedent as the v2 dialog).
          posthog.capture("v3_auto_rp_registered", { app_id: appId });
          setStatus("key-ready");
          return;
        }

        const detail = timeoutController.signal.aborted
          ? "Registration timed out — retry or continue without setup"
          : err instanceof Error
            ? err.message
            : "Registration failed";
        posthog.capture("v3_auto_rp_failed", { app_id: appId, detail });
        setError(detail);
        setStatus("failed");
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [registerRp, signerKey],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setSignerKey(null);
    setError(null);
  }, []);

  return { status, signerKey, error, run, reset };
};
