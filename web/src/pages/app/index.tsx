import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import useApps from "src/hooks/useApps";
import { requireAuthentication } from "src/lib/require-authentication";

export default function App() {
  //FIXME: temporary client redirect to default app page
  const { apps } = useApps();
  const router = useRouter();

  if (apps && apps.length) {
    router.push(`/app/${apps[0].id}`);
  } else {
    router.push("/app/default"); // TODO: Default app page?
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
