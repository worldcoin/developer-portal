"use client";

import { FormDialog } from "@/components/FormDialog";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { CreateAppForm } from "./Form";
import { useCreateAppDialog } from "./useCreateAppDialog";

export const CreateAppDialog = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  const { isOpen, close } = useCreateAppDialog();
  const previousTeamId = useRef(teamId);

  useEffect(() => {
    if (isOpen && previousTeamId.current !== teamId) {
      close();
    }

    previousTeamId.current = teamId;
  }, [close, isOpen, teamId]);

  return (
    <FormDialog
      open={isOpen}
      onClose={close}
      title="Create a new app"
      closeLabel="Close create app dialog"
    >
      <CreateAppForm key={teamId} teamId={teamId} />
    </FormDialog>
  );
};
