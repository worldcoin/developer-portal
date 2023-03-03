import { GetServerSideProps } from "next";
import { Team } from "src/scenes/team/team";
import { useAuthStore } from "src/stores/authStore";
export default Team;

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
