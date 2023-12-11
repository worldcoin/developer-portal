import { gql } from "@apollo/client";
import { GetServerSideProps } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { urls } from "src/lib/urls";
import { NoApps } from "src/components/NoApps";
import { PageInfo } from "@/components/PageInfo";
import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";

export default Actions;

function Actions() {
  return (
    <NoApps
      pageInfo={
        <PageInfo
          icon="notepad"
          title="Incognito Actions for your apps"
          text="Lets you verify someone is a real person that has never performed an action before."
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

export const getServerSideProps: GetServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res }) => {
    const session = await getSession(req, res);
    const client = await getAPIServiceClient();
    const user_id = session?.user.hasura.id;

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
          destination: urls.appActions(apps.data.app[0].id),
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
