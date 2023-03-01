import { GetServerSideProps } from "next";
import { Debugger } from "scenes/debugger/debugger";
import { useAuthStore } from "stores/authStore";

export default Debugger;

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
    props: {},
  };
};
