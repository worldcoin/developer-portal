import {
  FormDialog,
  formDialogDangerActionClassName,
  formDialogErrorClassName,
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { ModalIcon } from "@/components/ModalIcon";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { FetchAppsDocument } from "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { deleteApp } from "./server";

type DeleteModalProps = {
  openDeleteModal: boolean;
  setOpenDeleteModal: (open: boolean) => void;
  appName: string;
  appId: string;
  teamId: string;
};

// Typing the word beats typing the app name: same deliberate pause, no
// copy-pasting a long name. Case-insensitive so DELETE works too.
const schema = yup
  .object()
  .shape({
    app_name: yup
      .string()
      .matches(/^delete$/i, "Please check if the input is correct")
      .required("This field is required"),
  })
  .noUnknown();

type DeleteFormValues = yup.Asserts<typeof schema>;

export const DeleteModal = (props: DeleteModalProps) => {
  const { openDeleteModal, setOpenDeleteModal, appName, appId, teamId } = props;
  const [deletingApp, setDeletingApp] = useState(false);
  const router = useRouter();
  const { refetch: refetchApps } = useRefetchQueries(FetchAppsDocument, {
    teamId,
  });

  const handleDeleteApp = async () => {
    if (deletingApp) {
      return;
    }

    setDeletingApp(true);
    toast.info("Deleting app", { toastId: "deleting_app" });

    try {
      setOpenDeleteModal(false);

      const result = await deleteApp(appId);

      if (!result.success) {
        toast.update("deleting_app", {
          type: "error",
          render: result.message || "Failed to delete app",
          autoClose: 5000,
        });
        setDeletingApp(false);
        return;
      }

      await refetchApps();

      toast.update("deleting_app", {
        type: "success",
        render: `${appName} was deleted`,
        autoClose: 5000,
      });

      router.replace(`/teams/${teamId}/apps`);
    } catch (error) {
      console.error("Delete App: ", error);

      toast.update("deleting_app", {
        type: "error",
        render: "Failed to delete app",
        autoClose: 5000,
      });
    } finally {
      setDeletingApp(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<DeleteFormValues>({
    resolver: yupResolver(schema),
  });

  return (
    <FormDialog
      open={openDeleteModal}
      onClose={() => setOpenDeleteModal(false)}
      afterLeave={() => reset()}
      dismissable={!deletingApp}
      title="Delete app"
      closeLabel="Close delete app dialog"
    >
      <form
        className="grid w-full gap-y-6"
        onSubmit={handleSubmit(handleDeleteApp)}
      >
        <div className="grid justify-items-center gap-y-4">
          <ModalIcon variant="error">
            <AlertIcon className="size-7 text-white" />
          </ModalIcon>

          <p className="text-center font-world text-14 leading-[1.5] text-portal-muted">
            The{" "}
            <span className="font-medium break-all text-portal-text">
              {appName ?? ""}
            </span>{" "}
            will be deleted, along with all of its actions, configurations and
            statistics.
          </p>
        </div>

        <div>
          <label htmlFor="delete_app_name" className={formDialogLabelClassName}>
            To verify, type Delete below
          </label>
          <input
            id="delete_app_name"
            {...register("app_name")}
            className={formDialogInputClassName}
            disabled={deletingApp}
            aria-invalid={Boolean(errors.app_name)}
            aria-describedby={
              errors.app_name ? "delete-app-confirmation-error" : undefined
            }
            autoComplete="off"
            autoFocus
          />
          {errors.app_name?.message ? (
            <p
              id="delete-app-confirmation-error"
              className={formDialogErrorClassName}
            >
              {errors.app_name.message}
            </p>
          ) : null}
        </div>

        <div className="grid w-full gap-3 md:grid-cols-2">
          <button
            type="button"
            className={formDialogSecondaryActionClassName}
            onClick={() => setOpenDeleteModal(false)}
            disabled={deletingApp}
          >
            No
          </button>
          <button
            type="submit"
            className={formDialogDangerActionClassName}
            disabled={!isValid || deletingApp}
          >
            Yes
          </button>
        </div>
      </form>
    </FormDialog>
  );
};
