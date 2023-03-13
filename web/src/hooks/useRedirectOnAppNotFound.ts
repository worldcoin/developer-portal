import { useRouter } from "next/router";
import { useEffect } from "react";
import useApps from "./useApps";

const useRedirectOnAppNotFound = () => {
  const router = useRouter();
  const { currentApp, isLoading } = useApps();

  useEffect(() => {
    if (!isLoading && !currentApp) {
      router.push("/app");
    }
  }, [currentApp, isLoading, router]);
};

export default useRedirectOnAppNotFound;
