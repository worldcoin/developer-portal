"use client";

import { DestructiveTriggerButton } from "@/components/DestructiveTriggerButton";
import { urls } from "@/lib/urls";
import { LeaveTeamDialog } from "@/scenes/PortalV3/Profile/Teams/page/LeaveTeamDialog";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export const LeaveTeam = (props: {
  team: { id: string; name?: string | null };
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { invalidate } = useUser();
  const router = useRouter();

  const close = useCallback(
    async (didLeave: boolean) => {
      setIsOpen(false);

      if (!didLeave) {
        return;
      }

      const response = await fetch("/api/update-session", {
        method: "POST",
      }).catch(() => null);

      if (response?.ok) {
        await invalidate();
      }

      router.refresh();
      router.push(urls.dashboard());
    },
    [invalidate, router],
  );

  return (
    <>
      <DestructiveTriggerButton
        appearance="solid"
        onClick={() => setIsOpen(true)}
      >
        Leave team
      </DestructiveTriggerButton>

      <LeaveTeamDialog team={props.team} open={isOpen} onClose={close} />
    </>
  );
};
