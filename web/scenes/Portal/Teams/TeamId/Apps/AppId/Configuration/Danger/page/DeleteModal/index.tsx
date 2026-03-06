import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { FloatingInput } from "@/components/FloatingInput";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { ModalIcon } from "@/components/ModalIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { FetchAppsDocument } from "@/scenes/Portal/layout/AppSelector/graphql/client/fetch-apps.generated";
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

const createSchema = (appName: string) =>
  yup
    .object()
    .shape({
      app_name: yup
        .string()
        .oneOf([appName], "Please check if the input is correct")
        .required("This field is required"),
    })
    .noUnknown();

export const DeleteModal = (props: DeleteModalProps) => {
  const { openDeleteModal, setOpenDeleteModal, appName, appId, teamId } = props;
  const [deletingApp, setDeletingApp] = useState(false);
  const router = useRouter();
  const { refetch: refetchApps } = useRefetchQueries(FetchAppsDocument);
  const schema = createSchema(appName);

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

  type DeleteFormValues = yup.Asserts<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DeleteFormValues>({
    resolver: yupResolver(schema),
  });

  return (
    <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-6 md:max-w-[36rem]">
        <ModalIcon variant="error">
          <AlertIcon className="size-7 text-white" />
        </ModalIcon>

        <div className="grid w-full place-items-center gap-y-5">
          <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
            Do you want to delete this app?
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            The{" "}
            <Typography
              variant={TYPOGRAPHY.M3}
              className="break-all text-grey-900"
            >
              {appName ?? ""}
            </Typography>{" "}
            will be deleted, along with all of its actions, configurations and
            statistics.
          </Typography>
        </div>

        <form
          className="grid w-full gap-y-7"
          onSubmit={handleSubmit(handleDeleteApp)}
        >
          <FloatingInput
            id="delete_app_name"
            register={register("app_name")}
            label={
              <>
                To verify, type{" "}
                <span className="font-medium text-grey-900">{appName}</span>{" "}
                below
              </>
            }
            errors={errors.app_name}
          />

          <div className="grid w-full gap-4 md:grid-cols-2">
            <DecoratedButton
              type="button"
              variant="secondary"
              className="w-full py-3"
              onClick={() => setOpenDeleteModal(false)}
            >
              <Typography variant={TYPOGRAPHY.R3}>No</Typography>
            </DecoratedButton>

            <DecoratedButton
              type="submit"
              variant="destructive"
              className="w-full py-3"
              disabled={!isValid}
            >
              <Typography variant={TYPOGRAPHY.R3}>Yes</Typography>
            </DecoratedButton>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
