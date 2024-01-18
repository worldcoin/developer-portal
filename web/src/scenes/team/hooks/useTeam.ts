import {
  useTeamsQuery,
  TeamsDocument,
  useTeamsLazyQuery,
} from "@/scenes/team/graphql/teams.generated";
import { useUpdateTeamNameMutation } from "@/scenes/team/graphql/updateTeamName.generated";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useRemoveTeamMemberMutation } from "@/scenes/team/graphql/removeTeamMember.generated";
import { useRouter } from "next/router";
import { FetchUserDocument } from "@/components/Layout/LoggedUserDisplay/graphql/fetch-user.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { useFetchUser } from "@/components/Layout/LoggedUserDisplay/hooks/user-hooks";
import useKeys from "@/hooks/useKeys";
import { useAppStore } from "@/stores/appStore";

export type Team = NonNullable<
  NonNullable<ReturnType<typeof useTeamsQuery>["data"]>["team"]
>[0];
export type TeamMember = NonNullable<Team["memberships"]>[number];

export const useTeam = () => {
  const router = useRouter();
  const team_id = useMemo(() => router.query.team_id as string, [router]);
  const { user } = useFetchUser();
  const { refetchKeys } = useKeys();
  const { setCurrentApp } = useAppStore();

  const [fetchTeams, { data, ...other }] = useTeamsLazyQuery({
    context: { headers: { team_id } },
    variables: { team_id: team_id ?? "" },
  });

  useEffect(() => {
    if (!team_id) {
      return;
    }

    fetchTeams().then(() => {
      user.hasura.refetch();
      refetchKeys();
      setCurrentApp(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we don't need to execute this useEffect on user change
  }, [fetchTeams, team_id]);

  const team = useMemo(
    () => ({
      data: data?.team[0],
      ...other,
    }),
    [data?.team, other]
  );

  return team;
};

export const useUpdateTeamName = () => {
  const router = useRouter();
  const team_id = router.query.team_id as string | undefined;
  const user = useUser() as Auth0SessionUser;

  const [mutateFunction, other] = useUpdateTeamNameMutation({
    context: { headers: { team_id } },

    refetchQueries: [
      { query: TeamsDocument, context: { headers: { team_id } } },
      {
        query: FetchUserDocument,
        variables: { id: user.user?.hasura.id },
        context: { headers: { team_id } },
      },
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
export const useRemoveTeamMember = () => {
  const router = useRouter();
  const team_id = router.query.team_id as string | undefined;

  const [mutateFunction, other] = useRemoveTeamMemberMutation({
    context: { headers: { team_id } },

    refetchQueries: [
      { query: TeamsDocument, context: { headers: { team_id } } },
    ],
    onCompleted: () => {
      toast.success("Member removed");
    },
  });

  const removeTeamMember = useCallback(
    (id: string) => {
      return mutateFunction({
        context: { headers: { team_id } },
        variables: {
          id,
        },
      });
    },
    [mutateFunction, team_id]
  );

  return {
    removeTeamMember,
    ...other,
  };
};
