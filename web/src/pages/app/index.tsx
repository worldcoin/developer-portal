import { getCookie } from "cookies-next";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { getTokenFromCookie } from "src/backend/cookies";
import useApps from "src/hooks/useApps";
import { requireAuthentication } from "src/lib/require-authentication";

export default function App() {
  //FIXME: temporary client redirect to default app page
  const { apps } = useApps();
  const router = useRouter();

  if (apps) {
    router.push(`/app/${apps[0].id}`);
  }

  return null;
}

export const getServerSideProps: GetServerSideProps = requireAuthentication(
  async (context) => {
    return {
      props: {},
    };
  }
);
