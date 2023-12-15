import { toast } from "react-toastify";

import { useUpdateUserMutation } from "../graphql/update-user.generated";
import { FetchUserDocument } from "@/components/Layout/LoggedUserDisplay/graphql/fetch-user.generated";

export const useUpdateUser = (id: string) => {
  return useUpdateUserMutation({
    refetchQueries: [{ query: FetchUserDocument, variables: { id } }],
    onCompleted: () => {
      toast.success("Profile updated");
    },
  });
};
