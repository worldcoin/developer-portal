"use client";

import { useMeQuery } from "@/scenes/common/me-query/client";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { SwitcherTeam, TeamSwitcher } from "./TeamSwitcher";

/**
 * Data wrapper for TeamSwitcher — reads the user's team memberships from the
 * shared me-query. Kept thin and out of unit tests (TeamSwitcher is tested with
 * props).
 */
export const TeamSwitcherContainer = () => {
  const { teamId } = useParams() as { teamId?: string };
  const { user } = useMeQuery();

  const teams = useMemo<SwitcherTeam[]>(() => {
    const memberships = user?.memberships ?? [];
    return memberships
      .map((membership) => membership.team)
      .filter((team) => !!team?.id)
      .map((team) => ({ id: team!.id, name: team!.name ?? "Untitled team" }));
  }, [user?.memberships]);

  const currentTeam = teams.find((team) => team.id === teamId);

  if (!currentTeam) return null;

  return <TeamSwitcher currentTeam={currentTeam} teams={teams} />;
};
