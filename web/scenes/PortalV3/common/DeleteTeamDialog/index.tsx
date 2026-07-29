"use client";

import {
  DeleteTeamDialog as CommonDeleteTeamDialog,
  type DeleteTeamDialogProps,
} from "@/scenes/common/common/DeleteTeamDialog/client";

export const DeleteTeamDialog = (props: DeleteTeamDialogProps) => (
  <CommonDeleteTeamDialog {...props} refreshAfterDelete />
);
