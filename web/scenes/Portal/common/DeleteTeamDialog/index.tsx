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
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useDeleteTeamMutation } from "./graphql/client/delete-team.generated";

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

  const schema = useMemo(() => {
    return yup.object({
      confirmation: yup
        .string()
        .oneOf([team?.name ?? ""], "Please check if the input is correct")
        .required("This field is required"),
    });
  }, [team?.name]);

  type FormValues = yup.InferType<typeof schema>;

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

  const [deleteTeam] = useDeleteTeamMutation({
    context: { headers: { team_id: team?.id } },
    refetchQueries: [FetchMeDocument],
  });

  const { user } = useMeQuery({
    context: { headers: { team_id: team?.id } },
  });

  const submit = useCallback(async () => {
    if (!team?.id || !auth0User?.hasura?.id) {
      return toast.error("Error deleting team. Try again later");
    }

    try {
      await deleteTeam({
        variables: {
          id: team?.id,
        },
      });

      toast.success("Team deleted!");
      const membershipsCount = user.memberships?.length;

      if (typeof membershipsCount === "number" && membershipsCount === 0) {
        return router.push(urls.createTeam());
      }

      if (path !== urls.profileTeams()) {
        return router.push(urls.profileTeams());
      }

      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Error team deleting");
    }
  }, [
    team?.id,
    auth0User?.hasura?.id,
    deleteTeam,
    user.memberships?.length,
    path,
    onClose,
    router,
  ]);

  return (
    <Dialog {...props} onClose={onClose}>
      <DialogOverlay />

      <DialogPanel className="grid max-w-[400px] gap-y-8">
        <CircleIconContainer variant="error">
          <AlertIcon />
        </CircleIconContainer>

        <div className="grid gap-y-4">
          <Typography as="h3" variant={TYPOGRAPHY.H6} className="text-center">
            Are you sure?
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            The{" "}
            <span className="select-none font-medium text-gray-900">
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
              <span className="select-none">
                To verify, type{" "}
                <span className="font-medium text-gray-900">{team?.name}</span>{" "}
                below
              </span>
            }
            autoFocus
          />

          <div className="grid grid-cols-2 gap-x-4">
            <DecoratedButton
              disabled={!isValid || isSubmitting}
              type="submit"
              variant="danger"
              className="py-3"
            >
              Delete team
            </DecoratedButton>

            <DecoratedButton
              type="button"
              onClick={onClose}
              variant="primary"
              className="py-3"
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
