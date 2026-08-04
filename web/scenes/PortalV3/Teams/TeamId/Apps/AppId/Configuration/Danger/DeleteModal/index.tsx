import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { FetchAppsDocument } from "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { deleteApp } from "./server";

type DeleteModalProps = {
  openDeleteModal: boolean;
  setOpenDeleteModal: (open: boolean) => void;
  appName: string;
  appId: string;
  teamId: string;
};

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

  return (
    <DeleteConfirmationDialog
      open={openDeleteModal}
      onClose={() => setOpenDeleteModal(false)}
      onConfirm={handleDeleteApp}
      confirmationWord="Delete"
      title="Delete app"
      description={
        <>
          The{" "}
          <span className="font-medium break-all text-portal-text">
            {appName ?? ""}
          </span>{" "}
          will be deleted, along with all of its actions, configurations and
          statistics.
        </>
      }
    />
  );
};
