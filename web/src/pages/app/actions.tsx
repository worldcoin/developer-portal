import { gql } from "@apollo/client";
import { GetServerSideProps } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { requireAuthentication } from "src/lib/require-authentication";
import { urls } from "src/lib/urls";
import { NoApps } from "src/components/NoApps";
import { PageInfo } from "@/components/PageInfo";
import { withUserId } from "@/hocs/withUserId";

export default withUserId(Actions);

function Actions() {
  return (
    <NoApps
      pageInfo={
        <PageInfo
          icon="notepad"
          title="Anonymous actions for you apps"
          text="Lets you verify someone is a real person that has never performed an action before."
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

export const getServerSideProps: GetServerSideProps = requireAuthentication(
  async (_context, user_id) => {
    const client = await getAPIServiceClient();

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
          destination: urls.appActions(apps.data.app[0].id),
        },
      };
    }

    return {
      props: {
        user_id,
      },
    };
  }
);
