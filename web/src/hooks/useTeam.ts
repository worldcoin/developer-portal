import { graphQLRequest } from "@/lib/frontend-api";
import { TeamMemberModel, TeamModel } from "@/lib/models";
import { gql } from "@apollo/client";
import { useCallback } from "react";
import { toast } from "react-toastify";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const FetchTeamQuery = gql`
  query Teams {
    teams: team(limit: 1) {
      id
      name
      members: users {
        id
        name
        email
      }
    }
  }
`;

const UpdateTeamMutation = gql`
  mutation UpdateTeam($id: String!, $name: String!) {
    team: update_team_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
      id
    }
  }
`;

// TODO: In practice we currently only support 1 user = 1 team, when we change this we need to update this query to just remove the user from the team
const DeleteTeamMemberMutation = gql`
  mutation DeleteTeamMember($id: String!) {
    member: delete_user_by_pk(id: $id) {
      id
    }
  }
`;

const teamFetcher = async () => {
  const response = await graphQLRequest<{
    teams: Array<TeamModel>;
  }>({
    query: FetchTeamQuery,
  });

  if (response.data?.teams.length) {
    return response.data?.teams[0];
  }
  throw Error("No team");
};

const updateTeamFetcher = async (
  _key: string,
  args: {
    arg: {
      id: TeamModel["id"];
      name: TeamModel["name"];
    };
  }
) => {
  const { id, name } = args.arg;
  const response = await graphQLRequest<{
    team: Pick<TeamModel, "id">;
  }>({
    query: UpdateTeamMutation,
    variables: { id, name },
  });
  if (response.data?.team) {
    return response.data?.team;
  }
  throw Error("Could not delete team member");
};

const deleteTeamMemberFetcher = async (
  _key: string,
  args: {
    arg: {
      id: TeamMemberModel["id"];
    };
  }
) => {
  const { id } = args.arg;
  const response = await graphQLRequest<{
    member: Pick<TeamMemberModel, "id">;
  }>({
    query: DeleteTeamMemberMutation,
    variables: { id },
  });
  if (response.data?.member) {
    return response.data?.member;
  }
  throw Error("Could not delete team member");
};

export const useTeam = () => {
  return useSWR<TeamModel>("team", teamFetcher);
};

export const useUpdateTeamNameMutation = () => {
  const updateTeamMutation = useSWRMutation("team", updateTeamFetcher);

  const updateTeamName = useCallback(
    async (id: string, name: string) => {
      return updateTeamMutation.trigger({ id, name });
    },
    [updateTeamMutation]
  );

  return {
    updateTeamName,
    isLoading: updateTeamMutation.isMutating,
  };
};

export const useRemoveTeamMemberMutation = () => {
  const removeTeamMemberMutation = useSWRMutation(
    "team",
    deleteTeamMemberFetcher,
    {
      onSuccess: () => {
        toast.success("Member removed");
      },
    }
  );

  const removeTeamMember = useCallback(
    async (id: string) => {
      return removeTeamMemberMutation.trigger({ id });
    },
    [removeTeamMemberMutation]
  );

  return {
    removeTeamMember,
    isLoading: removeTeamMemberMutation.isMutating,
  };
};
