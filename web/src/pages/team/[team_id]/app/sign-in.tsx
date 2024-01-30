import { GetServerSideProps } from "next";
import { urls } from "src/lib/urls";
import { NoApps } from "src/components/NoApps";
import { PageInfo } from "@/components/PageInfo";
import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { getFirstApp } from "@/helpers/server/get-first-app";

export default SignIn;

function SignIn() {
  return (
    <NoApps
      pageInfo={
        <PageInfo
          icon="world-id-sign-in"
          title="Sign in with World ID"
          text="Create your first app to use Sign in with World ID."
        />
      }
    />
  );
}

export const getServerSideProps: GetServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res, query }) => {
    const session = await getSession(req, res);
    const user_id = session?.user.hasura.id;
    const team_id = query.team_id as string;
    const app_id = await getFirstApp({ user_id, team_id });

    if (!app_id) {
      return {
        props: {
          user_id,
        },
      };
    }

    return {
      redirect: {
        permanent: false,
        destination: urls.appSignIn({ team_id, app_id }),
      },
    };
  },
});
