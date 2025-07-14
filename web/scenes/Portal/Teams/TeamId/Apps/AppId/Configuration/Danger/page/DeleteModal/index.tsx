import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { WarningErrorIcon } from "@/components/Icons/WarningErrorIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { FetchAppsDocument } from "@/scenes/Portal/layout/AppSelector/graphql/client/fetch-apps.generated";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useDeleteAppMutation } from "./graphql/client/delete-app.generated";

type DeleteModalProps = {
  openDeleteModal: boolean;
  setOpenDeleteModal: (open: boolean) => void;
  appName: string;
  appId: string;
  teamId: string;
};

const schema = yup
  .object()
  .shape({
    app_name: yup
      .string()
      .oneOf(["DELETE"], "Please check if the input is correct")
      .required("This field is required"),
  })
  .noUnknown();

export const DeleteModal = (props: DeleteModalProps) => {
  const { openDeleteModal, setOpenDeleteModal, appName, appId, teamId } = props;
  const [deleteAppMutation, { loading: deletingApp }] = useDeleteAppMutation();
  const router = useRouter();

  const deleteApp = async () => {
    if (deletingApp) {
      return;
    }

    toast.info("Deleting app", { toastId: "deleting_app" });

    try {
      setOpenDeleteModal(false);

      await deleteAppMutation({
        variables: {
          id: appId,
        },

        refetchQueries: [FetchAppsDocument],
        awaitRefetchQueries: true,
      });

      toast.update("deleting_app", {
        type: "success",
        render: "App deleted",
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

      <DialogPanel className="grid gap-y-6 md:max-w-[26rem]">
        <CircleIconContainer variant={"error"}>
          <AlertIcon />
        </CircleIconContainer>

        <div className="grid w-full place-items-center gap-y-5">
          <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
            Are you sure?
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
            App will be deleted, along with all of its actions, configurations
            and statistics.
          </Typography>

          <div className="grid grid-cols-auto/1fr items-center gap-x-1 rounded-lg bg-system-error-50 px-3 py-2">
            <WarningErrorIcon className=" text-system-error-600" />

            <Typography
              variant={TYPOGRAPHY.B4}
              className="text-system-error-600"
            >
              This action is not reversible.
            </Typography>
          </div>
        </div>

        <form
          className="grid w-full gap-y-7"
          onSubmit={handleSubmit(deleteApp)}
        >
          <Input
            register={register("app_name")}
            label="To delete, type DELETE below"
            errors={errors.app_name}
          />

          <div className="grid w-full gap-4 md:grid-cols-2">
            <DecoratedButton
              type="submit"
              variant="danger"
              className="order-2 w-full bg-system-error-100 py-3 md:order-1"
              disabled={!isValid}
            >
              <Typography variant={TYPOGRAPHY.R3}>Delete App</Typography>
            </DecoratedButton>

            <DecoratedButton
              type="button"
              className="order-1 w-full py-3 md:order-2"
              onClick={() => setOpenDeleteModal(false)}
            >
              <Typography variant={TYPOGRAPHY.R3}>Keep App</Typography>
            </DecoratedButton>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
