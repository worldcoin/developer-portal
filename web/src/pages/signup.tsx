import { getAPIServiceGraphqlClient } from "@/backend/graphql";
import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Signup } from "src/scenes/signup/signup";
import { urls } from "@/lib/urls";

import {
  getSdk as getInviteByIdSdk,
  GetInviteByIdQuery,
} from "@/api/signup/graphql/getInviteById.generated";
import { LoginErrorCode } from "@/lib/types";

export default Signup;

export type SignupSSRProps = {
  hasAuth0User: boolean;
  invite?: GetInviteByIdQuery["invite"];
};

export const getServerSideProps = withPageAuthRequired({
  returnTo: "/api/auth/login-callback",
  getServerSideProps: async (context) => {
    const session = await getSession(context.req, context.res);
    const hasAuth0User = Boolean(session?.user);
    const invite_id = context.query.invite_id as string;

    if (invite_id) {
      const client = await getAPIServiceGraphqlClient();

      const { invite } = await getInviteByIdSdk(client).GetInviteById({
        id: invite_id,
      });

      if (!invite?.team) {
        return {
          redirect: {
            destination: urls.logout({ login_error: LoginErrorCode.Generic }),
            permanent: false,
          },
        };
      }

      return {
        props: {
          hasAuth0User,
          invite,
        } as SignupSSRProps,
      };
    }

    return {
      props: {
        hasAuth0User,
      } as SignupSSRProps,
    };
  },
});
