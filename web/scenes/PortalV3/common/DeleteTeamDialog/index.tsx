"use client";
import { DialogProps } from "@/components/Dialog";
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
  const { team } = props;
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
    reset();
    props.onClose(false);
  }, [props, reset]);

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

      const refetched = await refetch();
      const membershipsCount = refetched?.data?.user_by_pk?.memberships?.length;

      // The action rewrites the cookie itself; this only covers its failure.
      let sessionSynced = Boolean(result.sessionUpdated);

      if (!sessionSynced) {
        const response = await fetch("/api/update-session", {
          method: "POST",
        }).catch(() => null);

        const data = response?.ok
          ? await response.json().catch(() => null)
          : null;

        sessionSynced = Boolean(data?.success);
      }

      await invalidate();
      toast.success("Team deleted");

      if (!sessionSynced) {
        console.error("Delete Team Dialog: session sync failed after delete");
      }

      if (typeof membershipsCount === "number" && membershipsCount === 0) {
        return router.push(urls.createTeam());
      }

      // A push inside the same layout won't re-render the session-fed sidebar.
      router.refresh();

      if (path !== urls.profileTeams()) {
        return router.push(urls.profileTeams());
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
      closeLabel="Close delete team dialog"
      title="Are you sure?"
    >
      <div className="grid gap-y-6">
        <div className="grid gap-y-4">
          <p className="font-world text-14 leading-[1.5] text-portal-muted">
            The{" "}
            <span className="font-medium break-all text-portal-text select-none">
              {team?.name}
            </span>{" "}
            will be deleted, along with all of its apps, actions, configurations
            and statistics.
          </p>

          <div className="flex items-center gap-x-2 rounded-8 bg-system-error-50 px-3 py-2 text-system-error-600">
            <AlertIcon className="size-4 shrink-0" />

            <span className="font-world text-13 font-medium">
              This action cannot be undone.
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(submit)} className="grid w-full gap-y-6">
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
                errors.confirmation
                  ? "delete-team-confirmation-error"
                  : undefined
              }
              autoFocus
            />

            {errors.confirmation?.message && (
              <p
                id="delete-team-confirmation-error"
                className={formDialogErrorClassName}
              >
                {errors.confirmation.message}
              </p>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className={`${formDialogSecondaryActionClassName} order-1 md:order-none`}
              disabled={isSubmitting}
            >
              Keep team
            </button>

            <button
              disabled={!isValid || isSubmitting}
              type="submit"
              className={`${formDialogDangerActionClassName} order-2 md:order-none`}
            >
              Delete team
            </button>
          </div>
        </form>
      </div>
    </FormDialog>
  );
};
