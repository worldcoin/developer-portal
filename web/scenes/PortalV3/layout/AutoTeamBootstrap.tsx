"use client";

import { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { Button } from "@/components/Button";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useUser } from "@auth0/nextjs-auth0/client";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

type State = "creating" | "error" | "redirecting";

// Hard navigation, deliberately NOT router.push: the create-team response
// sets a fresh session cookie server-side, and a soft RSC navigation can read
// a stale (team-less) session and bounce straight back to /create-team —
// which re-fires the auto-create and collides on the duplicate-user
// constraint. A full document request guarantees the server sees the new
// cookie and lands the user in their workspace.
const hardNavigate = (url: string) => {
  window.location.assign(url);
};

// After a failed create, the team may already exist (a lost create race, or a
// retry after a dropped response). Refresh the session and poll the profile a
// few times; if a membership now exists, recover into it instead of failing
// loud over a team the user actually has.
const findExistingTeamId = async (
  refreshSession: () => Promise<unknown>,
): Promise<string | undefined> => {
  try {
    await refreshSession();
  } catch {
    // ignore — the probe below is the source of truth
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("/api/auth/profile", { cache: "no-store" });
      if (res.ok) {
        const profile = await res.json();
        const membership = profile?.hasura?.memberships?.find?.(
          (m: { team?: { id?: string } }) => m?.team?.id,
        );
        if (membership?.team?.id) {
          return membership.team.id as string;
        }
      }
    } catch {
      // transient — retry
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return undefined;
};

export const AutoTeamBootstrap = (props: {
  defaultName: string;
  hasUser: boolean;
}) => {
  const { defaultName, hasUser } = props;
  const { invalidate } = useUser();
  const [state, setState] = useState<State>("creating");
  const [detail, setDetail] = useState<string | undefined>();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    const run = async () => {
      const body: CreateTeamBody = { team_name: defaultName, hasUser };

      try {
        const res = await fetch("/api/create-team", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data: CreateTeamResponse = await res.json();

        if (!res.ok || !data.returnTo) {
          throw data;
        }

        posthog.capture("v3_auto_team_created");
        setState("redirecting");
        hardNavigate(data.returnTo);
      } catch (error) {
        const recoveredTeamId = await findExistingTeamId(invalidate);
        if (recoveredTeamId) {
          posthog.capture("v3_auto_team_recovered", {
            team_id: recoveredTeamId,
          });
          setState("redirecting");
          hardNavigate(urls.apps({ team_id: recoveredTeamId }));
          return;
        }
        const errorDetail =
          (error as Partial<CreateTeamResponse>)?.detail ??
          "Something went wrong";
        posthog.capture("v3_auto_team_failed", { detail: errorDetail });
        setDetail(errorDetail);
        setState("error");
      }
    };

    void run();
  }, [defaultName, hasUser, invalidate]);

  if (state === "error") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-6">
        <div className="border-border grid max-w-sm gap-y-3 rounded-xl border p-6 text-center">
          <Typography variant={TYPOGRAPHY.M3}>
            We couldn&apos;t set up your workspace
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            {detail}
          </Typography>
          <Button href={urls.createTeam()} className="underline">
            Set up your team manually
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center gap-3">
      <SpinnerIcon className="size-6 animate-spin" />
      <Typography variant={TYPOGRAPHY.R3}>
        Setting up your workspace…
      </Typography>
    </div>
  );
};
