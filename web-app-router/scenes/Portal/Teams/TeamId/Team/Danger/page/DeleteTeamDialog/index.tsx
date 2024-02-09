"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { Input } from "@/components/Input";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useDeleteTeamMutation } from "./graphql/client/delete-team.generated";
import { toast } from "react-toastify";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { FetchTeamQuery } from "@/scenes/Portal/Teams/TeamId/Team/common/TeamProfile/graphql/client/fetch-team.generated";
import { redirect } from "next/navigation";

type DeleteTeamDialogProps = DialogProps & {
  team: FetchTeamQuery["team_by_pk"];
};

export const DeleteTeamDialog = (props: DeleteTeamDialogProps) => {
  const { team } = props;
  const { user } = useUser() as Auth0SessionUser;

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
  });

  const submit = useCallback(async () => {
    if (!team?.id) return;
    try {
      await deleteTeam({
        variables: {
          id: team?.id,
        },
      });
      toast.success("Team deleted!");
      redirect("/teams");
    } catch (e) {
      console.error(e);
      toast.error("Error team deleting");
    }
  }, [deleteTeam, team?.id]);

  return (
    <Dialog {...props} onClose={onClose}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-8 max-w-[400px]">
        <CircleIconContainer variant="error">
          <AlertIcon />
        </CircleIconContainer>

        <div className="grid gap-y-4">
          <Typography as="h3" variant={TYPOGRAPHY.H6} className="text-center">
            Are you sure?
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-grey-500 text-center"
          >
            The{" "}
            <span className="font-medium text-gray-900 select-none">
              {team?.name}
            </span>{" "}
            will be deleted, along with all of its apps, actions, configurations
            and statistics.
          </Typography>

          <div className="text-system-error-600 grid grid-cols-auto/1fr items-center gap-x-1 justify-self-center px-3 py-2 bg-system-error-50 rounded-lg">
            <AlertIcon />

            <Typography variant={TYPOGRAPHY.B4}>
              This action cannot be undone.
            </Typography>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(submit)}
          className="grid gap-y-10 mt-2 w-full"
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
