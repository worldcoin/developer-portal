import { GetServerSideProps } from "next";
import { isAuthCookieValid } from "src/backend/cookies";
import { App } from "src/scenes/app";
export default App;

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

  return {
    props: {},
  };
};
