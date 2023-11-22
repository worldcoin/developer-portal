import { gql } from "@apollo/client";
import { GetServerSideProps } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { urls } from "src/lib/urls";
import { NoApps } from "src/components/NoApps";
import { PageInfo } from "@/components/PageInfo";
import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { LoginErrorCode } from "@/lib/types";

export default App;

function App() {
  return (
    <NoApps
      pageInfo={
        <PageInfo
          icon="apps"
          title="Home for your app overview"
          text="Create your first app to get started!"
        />
      }
    />
  );
}

const appsQuery = gql`
  query Apps($id: String!) {
    app(where: { team: { users: { id: { _eq: $id } } } }) {
      id
    }
  }
`;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res, query }) => {
    const session = await getSession(req, res);
    const client = await getAPIServiceClient();
    const user_id = session?.user.hasura.id;
    const login_error = query.login_error as LoginErrorCode;

    const apps = await client.query<{ app: Array<{ id: string }> }>({
      query: appsQuery,
      variables: {
        id: user_id,
      },
    });

    if (apps.data.app.length > 0) {
      return {
        redirect: {
          permanent: false,
          destination: urls.app(apps.data.app[0].id, { login_error }),
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
