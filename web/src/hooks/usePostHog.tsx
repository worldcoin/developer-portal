import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect } from "react";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
  });
}

export const usePostHog = (): void => {
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
