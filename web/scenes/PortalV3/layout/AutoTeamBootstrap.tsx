"use client";

import { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { Button } from "@/components/Button";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

export const deriveTeamName = (
  user: Auth0SessionUser["user"] | null | undefined,
): string => {
  const fromName = user?.name?.split(" ")[0];
  const fromEmail = user?.email?.split("@")[0];
  const first = fromName || fromEmail;
  return first ? `${first}'s team` : "My team";
};

type State = "creating" | "error" | "redirecting";

export const AutoTeamBootstrap = (props: {
  defaultName: string;
  hasUser: boolean;
}) => {
  const { defaultName, hasUser } = props;
  const router = useRouter();
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
        await invalidate();
        router.push(data.returnTo);
      } catch (error) {
        const errorDetail =
          (error as Partial<CreateTeamResponse>)?.detail ??
          "Something went wrong";
        posthog.capture("v3_auto_team_failed", { detail: errorDetail });
        setDetail(errorDetail);
        setState("error");
      }
    };

    void run();
  }, [defaultName, hasUser, invalidate, router]);

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
