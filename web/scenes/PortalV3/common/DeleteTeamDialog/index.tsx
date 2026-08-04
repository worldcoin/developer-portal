"use client";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DialogProps } from "@/components/Dialog";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { useUser } from "@auth0/nextjs-auth0/client";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { deleteTeamServerSide } from "@/scenes/common/common/DeleteTeamDialog/server";

type DeleteTeamDialogProps = DialogProps & {
  team: {
    id: string | null | undefined;
    name: string | null | undefined;
  };
};

export const DeleteTeamDialog = (props: DeleteTeamDialogProps) => {
  const { team } = props;
  const router = useRouter();
  const path = usePathname();
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const { invalidate } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onClose = useCallback(() => {
    props.onClose(false);
  }, [props]);

  const { refetch } = useMeQuery();

  // Post-delete flow lives here, not in an effect: the settings page unmounts this dialog when canWrite collapses, but an async handler keeps running.
  const submit = useCallback(async () => {
    if (!team?.id || !auth0User?.hasura?.id) {
      return toast.error("Error deleting team. Try again later");
    }

    setIsSubmitting(true);

    try {
      const result = await deleteTeamServerSide(team.id);

      if (!result.success) {
        return toast.error(result.message || "Error deleting team");
      }

      // Refetch before invalidate: invalidate updates the Auth0 client user,
      // which can flip canWrite false on team settings and unmount this dialog.
      // Parallel refetch then rejects on the unmounted Apollo hook and we toast
      // an error even though the delete already succeeded.
      await refetch();

      // The action rewrites the cookie itself; this only covers its failure.
      if (!result.sessionUpdated) {
        await fetch("/api/update-session", { method: "POST" }).catch(
          () => null,
        );
      }

      await invalidate();
      toast.success("Team deleted");

      // Refresh so the session-fed sidebar drops the deleted team; push alone
      // is a no-op when already on /profile (same layout).
      router.refresh();
      if (path !== urls.profile()) {
        return router.push(urls.profile());
      }

      onClose();
    } catch (e) {
      console.error("Delete Team Dialog: ", e);
      toast.error("Error deleting team");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    team?.id,
    auth0User?.hasura?.id,
    refetch,
    invalidate,
    router,
    path,
    onClose,
  ]);

  return (
    <DeleteConfirmationDialog
      open={Boolean(props.open)}
      onClose={onClose}
      onConfirm={submit}
      confirmationWord="Delete"
      loading={isSubmitting}
      title="Delete team"
      description={
        <>
          The{" "}
          <span className="font-medium break-all text-portal-text">
            {team?.name}
          </span>{" "}
          will be deleted, along with all of its apps, actions, configurations
          and statistics.
        </>
      }
    />
  );
};
