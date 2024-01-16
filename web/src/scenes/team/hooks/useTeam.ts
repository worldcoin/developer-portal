import {
  useTeamsQuery,
  TeamsDocument,
} from "@/scenes/team/graphql/teams.generated";
import { useUpdateTeamNameMutation } from "@/scenes/team/graphql/updateTeamName.generated";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useDeleteTeamMemberMutation } from "@/scenes/team/graphql/deleteTeam.generated";
import { useRouter } from "next/router";

export type Team = NonNullable<
  NonNullable<ReturnType<typeof useTeamsQuery>["data"]>["team"]
>[0];
export type TeamMember = NonNullable<Team["memberships"]>[number];

export const useTeam = () => {
  const router = useRouter();
  const team_id = router.query.team_id as string | undefined;

  const { data, ...other } = useTeamsQuery({
    context: { headers: { team_id } },
  });

  return {
    data: data?.team[0],
    ...other,
  };
};

export const useUpdateTeamName = () => {
  const router = useRouter();
  const team_id = router.query.team_id as string | undefined;

  const [mutateFunction, other] = useUpdateTeamNameMutation({
    context: { headers: { team_id } },
    refetchQueries: [
      { query: TeamsDocument, context: { headers: { team_id } } },
    ],
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
  const router = useRouter();
  const team_id = router.query.team_id as string | undefined;

  const [mutateFunction, other] = useDeleteTeamMemberMutation({
    context: { headers: { team_id } },

    refetchQueries: [
      { query: TeamsDocument, context: { headers: { team_id } } },
    ],
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
