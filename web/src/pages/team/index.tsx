import { getFirstTeamIdByUserId } from "@/helpers/server/get-first-team-id-by-user-id";
import { urls } from "@/lib/urls";
import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { GetServerSideProps } from "next";

export default function Team() {
  return null;
}

export const getServerSideProps: GetServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res }) => {
    const session = await getSession(req, res);
    const user_id = session?.user.hasura.id;
    const team_id = await getFirstTeamIdByUserId(user_id);

    if (!team_id) {
      return {
        redirect: {
          permanent: false,
          destination: "/404",
        },
      };
    }

    return {
      redirect: {
        permanent: false,
        destination: urls.app({ team_id }),
      },
    };
  },
});
