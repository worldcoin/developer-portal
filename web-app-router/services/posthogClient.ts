"use server";
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

export async function captureEvent({
  event,
  distinctId,
  properties,
}: CaptureEventParams): Promise<void> {
  if (!posthogClient) {
    posthogClient = initializePostHog();
  }
  if (posthogClient) {
    posthogClient.capture({
      distinctId,
      event,
      properties: { ...properties, $geoip_disable: true },
    });
    posthogClient.flush();
  }
}

export default posthogClient;
