"use client";

import { FormDialog } from "@/components/FormDialog";
import { CreateTeamForm } from "../Form";
import { useCreateTeamDialog } from "../useCreateTeamDialog";

export const CreateTeamDialog = () => {
  const { isOpen, close } = useCreateTeamDialog();

  return (
    <FormDialog
      open={isOpen}
      onClose={close}
      title="Create a new team"
      closeLabel="Close create team dialog"
    >
      <CreateTeamForm hasPortalUser presentation="dialog" />
    </FormDialog>
  );
};
