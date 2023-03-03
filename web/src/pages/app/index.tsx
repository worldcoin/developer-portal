import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import useApps from "src/hooks/useApps";

export default function App() {
  //FIXME: temporary client redirect to default app page
  const { apps } = useApps();
  const router = useRouter();

  if (apps) {
    router.push(`/app/${apps[0].id}`);
  }

  return null;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  // FIXME: Implement default app redirect when cookies token will be available
  return {
    props: {},
  };
}
