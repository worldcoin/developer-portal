"use client";

import { useEffect } from "react";

// Window (ms) within which we will not auto-reload again after we just did.
// Guards against tight reload loops if the stale-bundle issue somehow persists
// after a reload (e.g. CDN caching).
const RELOAD_COOLDOWN_MS = 30_000;
const RELOAD_KEY = "sa_reload_at";

// Match the Next.js stale-Server-Action error class. After a deploy the
// client bundle still references an action id the server no longer knows
// about, which surfaces as one of these messages:
//
//   - "Failed to find Server Action ..."
//   - "Cannot read properties of undefined (reading 'workers')"
//     (thrown inside next/dist/server/app-render after the action lookup
//     fails)
//   - "Failed to parse body as FormData"
//     (undici can't decode the action request body after the boundary
//     mismatch)
//
// See: https://nextjs.org/docs/messages/failed-to-find-server-action
const isStaleServerActionError = (error: Error & { digest?: string }) => {
  const message = error?.message ?? "";
  return (
    message.includes("Failed to find Server Action") ||
    message.includes(
      "Cannot read properties of undefined (reading 'workers')",
    ) ||
    message.includes("Failed to parse body as FormData")
  );
};

const shouldAutoReload = () => {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const last = window.sessionStorage.getItem(RELOAD_KEY);
    if (!last) {
      return true;
    }
    const lastAt = Number.parseInt(last, 10);
    if (!Number.isFinite(lastAt)) {
      return true;
    }
    return Date.now() - lastAt > RELOAD_COOLDOWN_MS;
  } catch {
    // sessionStorage is unavailable (private mode / disabled storage).
    // Without a persisted marker we can't enforce the cooldown across
    // the reload, so a recurring stale-action error would trigger a
    // reload on every render. Refuse to auto-reload — the manual
    // fallback UI handles it.
    return false;
  }
};

// Persist the reload marker. Returns true only if the write succeeded;
// callers MUST NOT trigger window.location.reload() unless this returns
// true, otherwise a recurring error after the reload becomes a tight
// loop with no enforceable cooldown.
const markReload = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    window.sessionStorage.setItem(RELOAD_KEY, Date.now().toString());
    return true;
  } catch {
    return false;
  }
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const staleAction = isStaleServerActionError(error);
  const willReload = staleAction && shouldAutoReload();

  useEffect(() => {
    if (!willReload) {
      return;
    }
    if (!markReload()) {
      // Cooldown marker couldn't be persisted; reloading without it
      // risks a tight loop if the error recurs. Skip the reload and
      // let the user retry manually via the fallback UI.
      return;
    }
    window.location.reload();
  }, [willReload]);

  return (
    <html lang="en">
      <body>
        {willReload ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "flex",
              minHeight: "100vh",
              alignItems: "center",
              justifyContent: "center",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              color: "#0c0e10",
            }}
          >
            Reloading…
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              minHeight: "100vh",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              padding: "24px",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              color: "#0c0e10",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
              Something went wrong
            </h1>
            <p style={{ color: "#657080", maxWidth: "420px" }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #d6d9dd",
                background: "#ffffff",
                color: "#0c0e10",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        )}
      </body>
    </html>
  );
}
