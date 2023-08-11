import { getSession } from "@auth0/nextjs-auth0";
import { GetServerSideProps } from "next";
import { Signup } from "src/scenes/signup/signup";
export default Signup;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context.req, context.res);
  const hasAuth0User = Boolean(session?.user);

  return {
    props: {
      hasAuth0User,
    },
  };
};
