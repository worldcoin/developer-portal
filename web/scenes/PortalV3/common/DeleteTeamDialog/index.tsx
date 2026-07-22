"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
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

      // Refresh session claims before navigating — server guards read memberships from the cookie.
      try {
        const res = await fetch("/api/update-session", { method: "POST" });
        if (res.ok) {
          await invalidate();
        }
      } catch {
        // Best effort — the next me-query pass heals the session.
      }

      toast.success("Team deleted!");

      if (typeof membershipsCount === "number" && membershipsCount === 0) {
        return router.push(urls.createTeam());
      }

      if (path !== urls.profileTeams()) {
        return router.push(urls.profileTeams());
      }

      // Already on the teams page: no navigation to re-render the session-fed sidebar, so force it.
      router.refresh();
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
    <Dialog {...props} onClose={onClose}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-8 md:max-w-100">
        <CircleIconContainer variant="error">
          <AlertIcon />
        </CircleIconContainer>

        <div className="grid gap-y-4">
          <Typography as="h3" variant={TYPOGRAPHY.H6} className="text-center">
            Are you sure?
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="max-w-[344px] text-center text-grey-500"
          >
            The{" "}
            <span className="font-medium break-all text-gray-900 select-none">
              {team?.name}
            </span>{" "}
            will be deleted, along with all of its apps, actions, configurations
            and statistics.
          </Typography>

          <div className="grid grid-cols-auto/1fr items-center gap-x-1 justify-self-center rounded-lg bg-system-error-50 px-3 py-2 text-system-error-600">
            <AlertIcon />

            <Typography variant={TYPOGRAPHY.B4}>
              This action cannot be undone.
            </Typography>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(submit)}
          className="mt-2 grid w-full gap-y-10"
        >
          <Input
            register={register("confirmation")}
            errors={errors.confirmation}
            label={
              <span className="select-none">To verify, type DELETE below</span>
            }
            autoFocus
          />

          <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
            <DecoratedButton
              disabled={!isValid || isSubmitting}
              type="submit"
              variant="danger"
              className="order-2 whitespace-nowrap md:order-1"
            >
              Delete team
            </DecoratedButton>

            <DecoratedButton
              type="button"
              onClick={onClose}
              variant="primary"
              className="order-1 whitespace-nowrap"
              disabled={isSubmitting}
            >
              Keep team
            </DecoratedButton>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
