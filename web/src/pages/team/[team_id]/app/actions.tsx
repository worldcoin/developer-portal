import { gql } from "@apollo/client";
import { GetServerSideProps } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { urls } from "src/lib/urls";
import { NoApps } from "src/components/NoApps";
import { PageInfo } from "@/components/PageInfo";
import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { getFirstApp } from "@/helpers/server/get-first-app";

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
        destination: urls.appActions({ team_id, app_id }),
      },
    };
  },
});
