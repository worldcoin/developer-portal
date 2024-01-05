import { PostHog } from "posthog-node";

interface CaptureEventParams {
  event: string;
  distinctId: string;
  properties: object;
}

// Initialize PostHog only if it hasn't been initialized yet
let posthogClient: PostHog | null = null;

if (!posthogClient) {
  posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_API_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
  });
}

export function captureEvent({
  event,
  distinctId,
  properties,
}: CaptureEventParams): void {
  if (posthogClient) {
    posthogClient.capture({
      distinctId,
      event,
      properties,
    });
  }
}

export default posthogClient;
