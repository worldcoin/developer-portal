import { toast } from "react-toastify";

import {
  useFetchUserLazyQuery,
  FetchUserDocument,
} from "../graphql/fetch-user.generated";

import { useUpdateUserMutation } from "../graphql/update-user.generated";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import { TeamsDocument } from "@/scenes/team/graphql/teams.generated";
import { Auth0SessionUser, Auth0User } from "@/lib/types";
import { urls } from "@/lib/urls";
import { use, useEffect } from "react";

export const useFetchUser = () => {
  const router = useRouter();
  const team_id = router.query.team_id as string | undefined;
  const { user: auth0User, ...rest } = useUser() as Auth0SessionUser;

  const [fetchUser, { data, ...other }] = useFetchUserLazyQuery({
    context: { headers: { team_id } },
    variables: { id: auth0User?.hasura?.id ?? "" },

    onCompleted: (data) => {
      if (!data.user[0]) {
        toast.error("Something went wrong. Please try again.");
        router.push(urls.logout());
      }
    },
  });

  useEffect(() => {
    if (!auth0User?.hasura?.id || !team_id) {
      return;
    }

    fetchUser();
  }, [auth0User?.hasura?.id, fetchUser, team_id]);

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

export const useUpdateUser = (id: string) => {
  const router = useRouter();
  const team_id = router.query.team_id as string | undefined;

  const [updateUser, other] = useUpdateUserMutation({
    context: { headers: { team_id } },
    refetchQueries: [
      {
        query: FetchUserDocument,
        variables: { id },
        context: { headers: { team_id } },
      },
      { query: TeamsDocument, context: { headers: { team_id } } },
    ],
    onCompleted: () => {
      toast.success("Profile updated");
    },
  });

  return { updateUser, ...other };
};
