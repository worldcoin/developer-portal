import { toast } from "react-toastify";

import {
  useFetchUserQuery,
  FetchUserDocument,
} from "../graphql/fetch-user.generated";

import { useUpdateUserMutation } from "../graphql/update-user.generated";
import { useRouter } from "next/router";
import { GetUsers200ResponseOneOfInner } from "auth0";
import useSWRImmutable from "swr/immutable";

const useFetchAuth0User = (auth0Id: string | undefined | null) => {
  const { data: auth0User, ...rest } =
    useSWRImmutable<GetUsers200ResponseOneOfInner>(
      auth0Id ? "/api/auth/fetch-user" : null,
      (url) =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: auth0Id }),
        }).then((res) => res.json())
    );

  return { auth0User, ...rest };
};

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

  const { auth0User, ...rest } = useFetchAuth0User(
    data?.user[0]?.auth0Id ?? ""
  );

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
  const [updateUser, other] = useUpdateUserMutation({
    refetchQueries: [{ query: FetchUserDocument, variables: { id } }],
    onCompleted: () => {
      toast.success("Profile updated");
    },
  });

  return { updateUser, ...other };
};
