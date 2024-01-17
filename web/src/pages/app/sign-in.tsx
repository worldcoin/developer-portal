import { gql } from "@apollo/client";
import { GetServerSideProps } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { urls } from "src/lib/urls";
import { NoApps } from "src/components/NoApps";
import { PageInfo } from "@/components/PageInfo";
import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";

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

const query = gql`
  query Apps($id: String!) {
    app(where: { team: { users: { id: { _eq: $id } } } }) {
      id
    }
  }
`;

export const getServerSideProps: GetServerSideProps = withPageAuthRequired({
  returnTo: "/api/auth/login-callback",
  getServerSideProps: async ({ req, res }) => {
    const session = await getSession(req, res);
    const client = await getAPIServiceClient();
    const user_id = session?.user.hasura.id;

    const apps = await client.query<{ app: Array<{ id: string }> }>({
      query,
      variables: {
        id: user_id,
      },
    });

    if (apps.data.app.length > 0) {
      return {
        redirect: {
          permanent: false,
          destination: urls.appSignIn(apps.data.app[0].id),
        },
      };
    }

    return {
      props: {
        user_id,
      },
    };
  },
});
