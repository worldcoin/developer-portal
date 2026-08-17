"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { InviteCard } from "../InviteCard";

export const JoinCallbackPageContent = (props: {
  invite_id: string;
  teamName: string;
  exitUrl: string;
}) => {
  const router = useRouter();
  const { invalidate } = useUser();
  const [joining, setJoining] = useState(false);

  // `invalidate` from useUser() is a new reference each render; hold the latest
  // in a ref so `joinTeam` stays stable across renders.
  const invalidateRef = useRef(invalidate);
  invalidateRef.current = invalidate;

  // Deliberately click-driven, never fired from an effect: this POST is what
  // consumes the single-use invite, and a cross-site navigation to this page
  // must not be able to complete the join on the visitor's behalf.
  const joinTeam = useCallback(async () => {
    setJoining(true);

    try {
      const res = await fetch(urls.api.joinCallback(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_id: props.invite_id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.returnTo) {
        toast.error(data?.detail ?? "Failed to join team");
        setJoining(false);

        return;
      }

      await invalidateRef.current();
      router.push(data.returnTo);
    } catch (error) {
      toast.error("Failed to join team");
      setJoining(false);
    }
  }, [props.invite_id, router]);

  return (
    <InviteCard
      title={`Join ${props.teamName}`}
      description={`You have been invited to join ${props.teamName} on World's Developer Portal. Accepting lets the team's members see your profile.`}
    >
      <div className="grid gap-y-3">
        <DecoratedButton
          type="button"
          onClick={joinTeam}
          loading={joining}
          disabled={joining}
          className="w-full py-3"
        >
          <Typography variant={TYPOGRAPHY.M3}>Join team</Typography>
        </DecoratedButton>

        <DecoratedButton
          href={props.exitUrl}
          variant="secondary"
          className="w-full py-3"
        >
          <Typography variant={TYPOGRAPHY.M3}>Not now</Typography>
        </DecoratedButton>
      </div>
    </InviteCard>
  );
};
