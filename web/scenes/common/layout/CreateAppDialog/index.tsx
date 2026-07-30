"use client";

import { FormDialog } from "@/components/FormDialog";
import { useParams } from "next/navigation";
import { CreateAppForm } from "./Form";
import { useCreateAppDialog } from "./useCreateAppDialog";

export const CreateAppDialog = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  const { isOpen, close } = useCreateAppDialog();

  return (
    <FormDialog
      open={isOpen}
      onClose={close}
      title="Create a new app"
      closeLabel="Close create app dialog"
    >
      <CreateAppForm teamId={teamId} />
    </FormDialog>
  );
};
