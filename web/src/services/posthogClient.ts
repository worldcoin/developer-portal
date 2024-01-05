import { PostHog } from "posthog-node";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
interface CaptureEventParams {
  event: string;
  distinctId: string;
  properties: object;
}

// Function to initialize PostHog
function initializePostHog(): PostHog | null {
  if (!publicRuntimeConfig.NEXT_PUBLIC_POSTHOG_API_KEY) {
    // API Key not available
    return null;
  }

  return new PostHog(publicRuntimeConfig.NEXT_PUBLIC_POSTHOG_API_KEY, {
    host:
      publicRuntimeConfig.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
  });
}

// Initialize PostHog only if it hasn't been initialized yet
let posthogClient: PostHog | null = null;

export function captureEvent({
  event,
  distinctId,
  properties,
}: CaptureEventParams): void {
  if (!posthogClient) {
    posthogClient = initializePostHog();
  }
  if (posthogClient) {
    posthogClient.capture({
      distinctId,
      event,
      properties,
    });
  }
}

export default posthogClient;
