"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  clearInviteIntent,
  peekInviteIntent,
  setInviteIntent,
} from "../invite-intent";

type JoinTeamButtonProps = {
  invite_id: string;
  hasSession: boolean;
  loginHref: string;
};

export const JoinTeamButton = (props: JoinTeamButtonProps) => {
  const router = useRouter();
  const { invalidate } = useUser();
  const [loading, setLoading] = useState(false);
  const [autoJoining, setAutoJoining] = useState(false);
  const startedAutoJoin = useRef(false);

  const invalidateRef = useRef(invalidate);
  invalidateRef.current = invalidate;

  const joinTeam = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(urls.api.joinCallback(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_id: props.invite_id }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        returnTo?: unknown;
        detail?: unknown;
      };

      if (!res.ok || typeof data.returnTo !== "string" || !data.returnTo) {
        throw new Error(
          typeof data.detail === "string" && data.detail
            ? data.detail
            : "Failed to join team",
        );
      }

      clearInviteIntent();
      await invalidateRef.current();
      router.push(data.returnTo);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to join team",
      );
      clearInviteIntent();
      setLoading(false);
      setAutoJoining(false);
    }
  }, [loading, props.invite_id, router]);

  useEffect(() => {
    if (!props.hasSession || startedAutoJoin.current) {
      return;
    }

    if (!peekInviteIntent(props.invite_id)) {
      return;
    }

    startedAutoJoin.current = true;
    setAutoJoining(true);
    void joinTeam();
  }, [joinTeam, props.hasSession, props.invite_id]);

  const startLogin = () => {
    setInviteIntent(props.invite_id);
    window.location.assign(props.loginHref);
  };

  if (autoJoining) {
    return (
      <div className="mt-2 flex justify-center py-3">
        <WorldIcon className="animate-ping" />
      </div>
    );
  }

  if (!props.hasSession) {
    return (
      <DecoratedButton type="button" onClick={startLogin} className="mt-2 py-3">
        <Typography variant={TYPOGRAPHY.M3}>Join team</Typography>
      </DecoratedButton>
    );
  }

  return (
    <DecoratedButton
      type="button"
      onClick={joinTeam}
      loading={loading}
      className="mt-2 py-3"
    >
      <Typography variant={TYPOGRAPHY.M3}>Join team</Typography>
    </DecoratedButton>
  );
};
