import { gql } from "@apollo/client";
import { GetServerSideProps } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { requireAuthentication } from "src/lib/require-authentication";
import { urls } from "src/lib/urls";
import { NoApps } from "src/components/NoApps";
import { PageInfo } from "@/components/PageInfo";

export default function SignIn() {
  return (
    <NoApps
      pageInfo={
        <PageInfo
          icon="world-id-sign-in"
          title="Sing in with Worldcoin"
          text="Create your first app to use Sign in with Worldcoin."
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
          destination: urls.appSignIn(apps.data.app[0].id),
        },
      };
    }

    return {
      props: {},
    };
  }
);
