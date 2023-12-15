import { useFetchUserQuery } from "../graphql/fetch-user.generated";

import { useRouter } from "next/router";
import { UserContext, useUser } from "@auth0/nextjs-auth0/client";

export const useFetchUser = () => {
  const { user: auth0User, ...rest } = useUser() as Omit<
    UserContext,
    "user"
  > & {
    user: UserContext["user"] & {
      hasura: {
        id: string;
        auth0Id: string;
        team_id: string;
      };
    };
  };

  const router = useRouter();

  const { data, ...other } = useFetchUserQuery({
    variables: { id: auth0User?.hasura?.id },

    onCompleted: (data) => {
      if (!data.user[0]) {
        router.push("/logout");
      }
    },
  });

  return {
    user: {
      hasura: {
        ...data?.user[0],
        ...other,
      },

      auth0: {
        ...auth0User,
        ...rest,
      },
    },
  };
};
