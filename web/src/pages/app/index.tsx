import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import useApps from "src/hooks/useApps";
import { requireAuthentication } from "src/lib/require-authentication";

export default function App() {
  const { apps, isLoading } = useApps();
  const router = useRouter();

  useEffect(() => {
    if (router.isReady && !isLoading) {
      router.push(apps?.length ? `/app/${apps[0].id}` : "/team");
    }
  }, [apps, isLoading, router]);

  return null;
}

export const getServerSideProps: GetServerSideProps = requireAuthentication(
  async (context) => {
    return {
      props: {},
    };
  }
);
