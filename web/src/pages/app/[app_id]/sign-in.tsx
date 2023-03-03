import { SignIn } from "@/scenes/sign-in-with-world-id";
import { GetServerSideProps } from "next";
import { useAuthStore } from "src/stores/authStore";
export default SignIn;

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
