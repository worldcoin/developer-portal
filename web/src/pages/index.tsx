import { getFirstTeamIdByUserId } from "@/helpers/server/get-first-team-id-by-user-id";
import { getSession } from "@auth0/nextjs-auth0";
import { GetServerSideProps } from "next";
import { urls } from "src/lib/urls";

const page = () => null;
export default page;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getSession(req, res);
  const user_id = session?.user.hasura.id;

  if (!session?.user) {
    return {
      redirect: {
        destination: urls.login(),
        permanent: false,
      },
    };
  }

  const team_id = await getFirstTeamIdByUserId(user_id);

  if (!team_id) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: urls.app({ team_id }),
      permanent: false,
    },
  };
};
