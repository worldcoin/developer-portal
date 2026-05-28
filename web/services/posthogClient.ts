import { logger } from "@/lib/logger";
import { PostHog } from "posthog-node";

interface CaptureEventParams {
  event: string;
  distinctId: string;
  properties: object;
}

// Only use this function in the server
function initializePostHog(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
    // API Key not available
    return null;
  }

  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
  });
}

// Initialize PostHog only if it hasn't been initialized yet
let posthogClient: PostHog | null = null;

/**
 * Send a PostHog event from server code.
 *
 * Telemetry is best-effort: PostHog upstream failures (TLS resets, socket
 * hang-ups against app.posthog.com, etc.) must never propagate into the
 * caller's response path or count toward the developer-portal's error rate.
 * We catch and log at `warn`, then resolve.
 */
export async function captureEvent({
  event,
  distinctId,
  properties,
}: CaptureEventParams): Promise<void> {
  try {
    if (!posthogClient) {
      posthogClient = initializePostHog();
    }
    if (!posthogClient) {
      return;
    }
    posthogClient.capture({
      distinctId,
      event,
      properties: { ...properties, $geoip_disable: true },
    });
    // flush() returns a Promise in posthog-node v4; without an attached
    // handler an upstream socket error becomes an unhandled rejection that
    // dd-trace's http instrumentation reports as a service error.
    const flushed = posthogClient.flush();
    if (flushed && typeof flushed.catch === "function") {
      flushed.catch((error) => {
        logger.warn("PostHog flush failed", {
          event,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
  } catch (error) {
    logger.warn("PostHog captureEvent failed", {
      event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default posthogClient;
