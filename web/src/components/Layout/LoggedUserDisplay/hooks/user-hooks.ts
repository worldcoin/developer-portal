import { toast } from "react-toastify";

import {
  useFetchUserQuery,
  FetchUserDocument,
} from "../graphql/fetch-user.generated";

import { useUpdateUserMutation } from "../graphql/update-user.generated";

export const useFetchUser = (id: string) => {
  const { data, ...other } = useFetchUserQuery({ variables: { id } });
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
