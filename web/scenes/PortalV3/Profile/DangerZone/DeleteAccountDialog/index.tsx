"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DialogProps } from "@/components/Dialog";
import { FormDialog } from "@/components/FormDialog";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { DeleteAccountDocument } from "@/scenes/common/Profile/DangerZone/DeleteAccountDialog/graphql/client/delete-account.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation } from "@apollo/client/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";

const DELETE_WORD = "DELETE";
const actionClassName =
  "inline-flex h-11 w-full items-center justify-center rounded-8 px-4 font-world text-13 leading-none font-medium whitespace-nowrap outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed";

const schema = yup
  .object({
    confirmation: yup
      .string()
      .oneOf([DELETE_WORD], "Please check if the input is correct")
      .required("This field is required"),
  })
  .noUnknown();

type FormValues = yup.InferType<typeof schema>;

export const DeleteAccountDialog = (props: DialogProps) => {
  const { user } = useUser() as Auth0SessionUser;

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

  const [deleteAccount] = useMutation(DeleteAccountDocument);

  const submit = useCallback(async () => {
    if (!user?.hasura) return;
    try {
      await deleteAccount({
        variables: {
          user_id: user.hasura.id,
        },
      });
      toast.success("Account Deleted!");
      window.location.href = urls.api.authDeleteAccount();
    } catch (e) {
      console.error("Delete Account Dialog: ", e);
      toast.error("Error deleting account");
    }
  }, [deleteAccount, user?.hasura]);

  return (
    <FormDialog
      open={Boolean(props.open)}
      onClose={onClose}
      closeLabel="Close delete account dialog"
      title="Delete account"
    >
      <form onSubmit={handleSubmit(submit)} className="grid w-full gap-y-6">
        <div className="grid justify-items-center gap-y-4">
          <CircleIconContainer variant="error">
            <AlertIcon />
          </CircleIconContainer>

          <p className="text-center font-world text-14 leading-[1.5] text-portal-muted">
            Your account will be deleted, along with all apps and data. You will
            be removed from teams.
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
            htmlFor="delete-account-confirmation"
            className="mb-2 block font-world text-13 leading-none font-medium text-portal-text"
          >
            To confirm, type DELETE below
          </label>

          <input
            id="delete-account-confirmation"
            {...register("confirmation")}
            className="h-11 w-full rounded-8 border border-grey-200 bg-grey-0 px-3 font-world text-14 text-portal-text outline-hidden transition focus:border-grey-400 focus:ring-2 focus:ring-grey-200"
            aria-invalid={Boolean(errors.confirmation)}
            aria-describedby={
              errors.confirmation
                ? "delete-account-confirmation-error"
                : undefined
            }
            autoComplete="off"
            autoFocus
          />

          {errors.confirmation?.message ? (
            <p
              id="delete-account-confirmation-error"
              className="mt-2 font-world text-12 leading-[1.4] text-system-error-600"
            >
              {errors.confirmation.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className={`${actionClassName} border border-grey-200 bg-grey-0 text-portal-text enabled:hover:bg-grey-50 disabled:text-grey-300`}
            disabled={isSubmitting}
          >
            Keep account
          </button>

          <button
            disabled={!isValid || isSubmitting}
            type="submit"
            className={`${actionClassName} bg-system-error-600 text-white enabled:hover:bg-system-error-500 disabled:bg-grey-200 disabled:text-grey-400`}
          >
            Delete account
          </button>
        </div>
      </form>
    </FormDialog>
  );
};
