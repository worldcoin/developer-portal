import { GetServerSideProps } from "next";
import { App } from "src/scenes/app";
import { useAuthStore } from "src/stores/authStore";
export default App;

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
