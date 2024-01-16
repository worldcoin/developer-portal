import { urls } from "src/lib/urls";
import { NoApps } from "src/components/NoApps";
import { PageInfo } from "@/components/PageInfo";
import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { LoginErrorCode } from "@/lib/types";
import { getFirstApp } from "@/helpers/server/get-first-app";

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

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res, query }) => {
    const session = await getSession(req, res);
    const user_id = session?.user.hasura.id;
    const login_error = query.login_error as LoginErrorCode;
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
        destination: urls.app({
          app_id,
          ...(login_error ? { params: { login_error } } : {}),
          team_id,
        }),
      },
    };
  },
});
