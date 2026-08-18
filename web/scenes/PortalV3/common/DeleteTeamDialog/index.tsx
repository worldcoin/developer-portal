"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import type { DialogProps } from "@/components/Dialog";
import {
  FormDialog,
  formDialogDangerActionClassName,
  formDialogErrorClassName,
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { deleteTeamServerSide } from "@/scenes/common/common/DeleteTeamDialog/server";

type DeleteTeamDialogProps = DialogProps & {
  team: {
    id: string | null | undefined;
    name: string | null | undefined;
  };
};

const schema = yup
  .object({
    confirmation: yup
      .string()
      .oneOf(["DELETE"], "Please check if the input is correct")
      .required("This field is required"),
  })
  .noUnknown();

type FormValues = yup.InferType<typeof schema>;

export const DeleteTeamDialog = (props: DeleteTeamDialogProps) => {
  const { team, onClose: onCloseDialog } = props;
  const router = useRouter();
  const path = usePathname();
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const { invalidate } = useUser();

  const {
    register,
    handleSubmit,
    formState: { isValid, isSubmitting, errors },
    reset,
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const onClose = useCallback(() => {
    onCloseDialog(false);
  }, [onCloseDialog]);

  const afterLeave = useCallback(() => {
    reset();
  }, [reset]);

  const { refetch } = useMeQuery();

  // Post-delete flow lives here, not in an effect: the settings page unmounts this dialog when canWrite collapses, but an async handler keeps running.
  const submit = useCallback(async () => {
    if (!team?.id || !auth0User?.hasura?.id) {
      return toast.error("Error deleting team. Try again later");
    }

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
    <FormDialog
      open={Boolean(props.open)}
      onClose={onClose}
      afterLeave={afterLeave}
      dismissable={!isSubmitting}
      closeLabel="Close delete team dialog"
      title="Delete team"
    >
      <form onSubmit={handleSubmit(submit)} className="grid w-full gap-y-6">
        <div className="grid justify-items-center gap-y-4">
          <CircleIconContainer variant="error">
            <AlertIcon />
          </CircleIconContainer>

          <p className="max-w-[344px] text-center font-world text-14 leading-[1.5] text-portal-muted">
            The{" "}
            <span className="font-medium break-all text-portal-text select-none">
              {team?.name}
            </span>{" "}
            will be deleted, along with all of its apps, actions, configurations
            and statistics.
          </p>

          <div className="flex items-center gap-x-2 rounded-8 bg-system-error-50 px-3 py-2 text-system-error-600">
            <AlertIcon className="size-4 shrink-0" />
            <span className="font-world text-13 leading-none font-medium">
              This action cannot be undone.
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="delete-team-confirmation"
            className={formDialogLabelClassName}
          >
            To verify, type DELETE below
          </label>
          <input
            id="delete-team-confirmation"
            {...register("confirmation")}
            className={formDialogInputClassName}
            aria-invalid={Boolean(errors.confirmation)}
            aria-describedby={
              errors.confirmation ? "delete-team-confirmation-error" : undefined
            }
            autoComplete="off"
            autoFocus
          />
          {errors.confirmation?.message ? (
            <p
              id="delete-team-confirmation-error"
              className={formDialogErrorClassName}
            >
              {errors.confirmation.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className={formDialogSecondaryActionClassName}
            disabled={isSubmitting}
          >
            Keep team
          </button>
          <button
            disabled={!isValid || isSubmitting}
            type="submit"
            className={formDialogDangerActionClassName}
          >
            Delete team
          </button>
        </div>
      </form>
    </FormDialog>
  );
};
