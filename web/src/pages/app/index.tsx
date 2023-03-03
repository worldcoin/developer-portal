import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import useApps from "src/hooks/useApps";
import { useAuthStore } from "src/stores/authStore";

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
  const isValid = useAuthStore.getState().isAuthCookiesValid(ctx);

  if (!isValid) {
    useAuthStore.getState().setAuthCookies(null, ctx.resolvedUrl, ctx);

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
