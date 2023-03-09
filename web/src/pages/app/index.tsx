import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { isAuthCookieValid } from "src/backend/cookies";
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const isAuthenticated = await isAuthCookieValid(ctx);
  if (!isAuthenticated) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  //TODO: Fetch default app with token & redirect to app/[app_id] page

  return {
    props: {},
  };
};
