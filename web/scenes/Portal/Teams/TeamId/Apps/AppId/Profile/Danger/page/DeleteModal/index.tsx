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
export const DeleteModal = (props: DeleteModalProps) => {
  const { openDeleteModal, setOpenDeleteModal, appName, appId, teamId } = props;
  const [deleteAppMutation, { loading: deletingApp }] = useDeleteAppMutation();
  const router = useRouter();

  const deleteApp = async () => {
    if (deletingApp) return;
    toast.info("Deleting app", { toastId: "deleting_app" });
    try {
      setOpenDeleteModal(false);

      await deleteAppMutation({
        variables: {
          id: appId,
        },
        context: { headers: { team_id: teamId } },
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
      console.error(error);
      toast.update("deleting_app", {
        type: "error",
        render: "Failed to delete app",
        autoClose: 5000,
      });
    }
  };

  const schema = yup.object().shape({
    app_name: yup
      .string()
      .oneOf([appName], `App Name must be ${appName}`)
      .required("This field is required"),
  });

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
      <DialogPanel className="mx-auto grid gap-y-6 rounded-xl bg-white md:w-5">
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
            <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
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
            label={
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
                {" "}
                To delete, type{" "}
                <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
                  {appName}
                </Typography>{" "}
                below
              </Typography>
            }
            errors={errors.app_name}
          />
          <div className="grid w-full grid-cols-2 gap-x-5">
            <DecoratedButton
              type="submit"
              variant="danger"
              className="w-full bg-system-error-100"
              disabled={!isValid}
            >
              <Typography variant={TYPOGRAPHY.R3}>Delete App</Typography>
            </DecoratedButton>

            <DecoratedButton
              type="submit"
              className="w-full"
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
