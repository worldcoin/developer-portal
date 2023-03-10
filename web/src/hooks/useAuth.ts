import { gql } from "@apollo/client";
import { graphQLRequest } from "src/lib/frontend-api";
import { decodeJwt } from "jose";
import { TeamModel, UserModel } from "src/lib/models";
import { useAuthStore } from "src/stores/authStore";
import useSWR from "swr";

export type UserWithTeam = Pick<UserModel, "id" | "email" | "id"> & {
  team: Pick<TeamModel, "id" | "name">;
};

const FetchMeQuery = gql`
  query FetchMeQuery($id: String!) {
    user(where: { id: { _eq: $id } }) {
      id
      email
      team {
        id
        name
      }
    }
  }
`;

const fetchUser = (userId?: string) => async () => {
  if (!userId) {
    throw new Error("Missing user id");
  }

  const response = await graphQLRequest<{
    user: Array<UserWithTeam>;
  }>({
    query: FetchMeQuery,
    variables: { id: userId },
  });

  if (response.data?.user?.length) {
    return response.data.user[0];
  }

  throw new Error("No user");
};

const useAuth = (userId?: string) => {
  const { data, error, isLoading } = useSWR<UserWithTeam>(
    "user",
    fetchUser(userId)
  );
  return { user: data, isLoading, isAuthenticated: !error && !isLoading };
};

export default useAuth;
