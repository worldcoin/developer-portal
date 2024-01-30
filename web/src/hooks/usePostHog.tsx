import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect } from "react";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

if (typeof window !== "undefined") {
  posthog.init(publicRuntimeConfig.NEXT_PUBLIC_POSTHOG_API_KEY!, {
    api_host:
      publicRuntimeConfig.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    loaded: (posthog) => {
      if (publicRuntimeConfig.NODE_ENV === "development") posthog.debug();
    },
    disable_session_recording: true,
  });
}

// Make a graphql Query then call identify
export const usePostHog = async (): Promise<void> => {
  const router = useRouter();

  useEffect((): (() => void) => {
    // Track $pageview
    const handleRouteChange = (_: any, { shallow }: { shallow: boolean }) => {
      if (!shallow) {
        posthog.capture("$pageview");
      }
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
