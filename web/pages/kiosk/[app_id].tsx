import { GetServerSideProps, NextPageContext } from "next";
import { Kiosk } from "scenes/kiosk/kiosk";
import { useAuthStore } from "stores/authStore";
export default Kiosk;

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

  return {
    props: { appId: ctx.query.app_id },
  };
};
