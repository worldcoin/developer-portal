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
import { useCallback, useEffect, useState } from "react";
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
  const [deleteFinished, setDeleteFinished] = useState(false);

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
    setDeleteFinished(false);
    props.onClose(false);
  }, [props, reset, setDeleteFinished]);

  const [deleteTeam] = useDeleteTeamMutation({
    refetchQueries: [FetchMeDocument],
    awaitRefetchQueries: true,
  });

  const { user, loading } = useMeQuery();

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
      setDeleteFinished(true);
    } catch (e) {
      console.error("Delete Team Dialog: ", e);
      toast.error("Error deleting team");
    }
  }, [team?.id, auth0User?.hasura?.id, deleteTeam]);

  useEffect(() => {
    if (!deleteFinished || loading) {
      return;
    }

    const membershipsCount = user.memberships?.length;

    if (typeof membershipsCount === "number" && membershipsCount === 0) {
      return router.push(urls.createTeam());
    }

    if (path !== urls.profileTeams()) {
      return router.push(urls.profileTeams());
    }

    onClose();
  }, [
    deleteFinished,
    loading,
    onClose,
    path,
    router,
    user.memberships?.length,
  ]);

  return (
    <Dialog {...props} onClose={onClose}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-8 md:max-w-[25rem]">
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
            <span className="select-none break-all font-medium text-gray-900">
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
