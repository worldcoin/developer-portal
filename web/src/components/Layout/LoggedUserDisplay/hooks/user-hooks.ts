import { toast } from "react-toastify";

import {
  useFetchUserQuery,
  FetchUserDocument,
} from "../graphql/fetch-user.generated";

import { useUpdateUserMutation } from "../graphql/update-user.generated";
import { useRouter } from "next/router";

export const useFetchUser = (id: string) => {
  const router = useRouter();

  const { data, ...other } = useFetchUserQuery({
    variables: { id },
    onCompleted: (data) => {
      // FIXME: Temporary fix for NoApps issue
      // if (!data.user[0]) {
      //   router.push("/logout");
      // }
    },
  });
  return { user: data?.user[0], ...other };
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
