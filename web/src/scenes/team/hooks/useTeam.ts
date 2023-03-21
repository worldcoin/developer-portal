import {
  useTeamsQuery,
  TeamsDocument,
} from "@/scenes/team/graphql/teams.generated";
import { useUpdateTeamNameMutation } from "@/scenes/team/graphql/updateTeamName.generated";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { useDeleteTeamMemberMutation } from "@/scenes/team/graphql/deleteTeam.generated";

export type Team = NonNullable<
  NonNullable<ReturnType<typeof useTeamsQuery>["data"]>["teams"]
>[0];
export type TeamMember = NonNullable<Team["members"]>[0];

export const useTeam = () => {
  const { data, ...other } = useTeamsQuery();
  return {
    data: data?.teams[0],
    ...other,
  };
};

export const useUpdateTeamName = () => {
  const [mutateFunction, other] = useUpdateTeamNameMutation({
    refetchQueries: [{ query: TeamsDocument }],
    onCompleted: () => {
      toast.success("Team updated");
    },
  });

  const updateTeamName = useCallback(
    (id: string, name: string) => {
      return mutateFunction({
        variables: {
          id,
          name,
        },
      });
    },
    [mutateFunction]
  );

  return {
    updateTeamName,
    ...other,
  };
};

// TODO: In practice we currently only support 1 user = 1 team, when we change this we need to update this query to just remove the user from the team
export const useDeleteTeamMember = () => {
  const [mutateFunction, other] = useDeleteTeamMemberMutation({
    refetchQueries: [{ query: TeamsDocument }],
    onCompleted: () => {
      toast.success("Member removed");
    },
  });

  const deleteTeamMember = useCallback(
    (id: string) => {
      return mutateFunction({
        variables: {
          id,
        },
      });
    },
    [mutateFunction]
  );

  return {
    deleteTeamMember,
    ...other,
  };
};
