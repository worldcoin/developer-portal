import { toast } from "react-toastify";

import {
  useFetchUserQuery,
  FetchUserDocument,
} from "../graphql/fetch-user.generated";

import { useUpdateUserMutation } from "../graphql/update-user.generated";
import { useRouter } from "next/router";
import { GetUsers200ResponseOneOfInner } from "auth0";
import useSWRImmutable from "swr/immutable";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMemo } from "react";

export const useFetchUser = (id: string) => {
  const router = useRouter();

  const { data, ...other } = useFetchUserQuery({
    variables: { id },
    onCompleted: (data) => {
      if (!data.user[0]) {
        router.push("/logout");
      }
    },
  });

  const { user: sessionAuth0user, ...auth0sessionRest } = useUser();

  const shouldFetchUserFromAuth0 = useMemo(
    () => !sessionAuth0user && data?.user[0]?.auth0Id,
    [data?.user, sessionAuth0user]
  );

  const { data: auth0User, ...rest } =
    useSWRImmutable<GetUsers200ResponseOneOfInner>(
      shouldFetchUserFromAuth0 ? "/api/auth/fetch-user" : null,
      (url) =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: data?.user[0]?.auth0Id }),
        }).then((res) => res.json())
    );

  return {
    user: {
      hasura: {
        ...data?.user[0],
        ...other,
      },

      auth0User: {
        isSessionData: Boolean(sessionAuth0user),
        user: sessionAuth0user ?? auth0User,
        ...(sessionAuth0user && auth0sessionRest),
        ...(auth0User && rest),
      },
    },
  };
};

export const useUpdateUser = (id: string) => {
  const [updateUser, other] = useUpdateUserMutation({
    refetchQueries: [{ query: FetchUserDocument, variables: { id } }],
    onCompleted: () => {
      toast.success("Profile updated");
    },
  });

  return { updateUser, ...other };
};
