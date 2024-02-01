"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { Dialog } from "@/components/Dialog";
import { useCallback, useState } from "react";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { useDeleteActionMutation } from "./graphql/client/delete-action.generated";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export const ActionDangerZoneContent = (props: { action: any }) => {
  const { action } = props;
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const router = useRouter();

  const [deleteActionQuery, { loading: deleteActionLoading }] =
    useDeleteActionMutation({});

  const deleteAction = useCallback(async () => {
    try {
      const result = await deleteActionQuery({
        variables: { id: action.id ?? "" },
        refetchQueries: ["GetActions"],
      });
      if (result instanceof Error) {
        throw result;
      }
      router.replace(`..`); // TODO: Need to refetch action list to update, waiting till we decide on state
    } catch (error) {
      console.error(error);
      return toast.error("Unable to delete action");
    }
    toast.success(`${action?.name} was deleted.`);
  }, [action.id, action?.name, deleteActionQuery, router]);

  return (
    <div>
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <DialogOverlay />
        <DialogPanel className="rounded-x bg-white mx-auto w-5 grid gap-y-6">
          <CircleIconContainer variant={"error"}>
            <AlertIcon />
          </CircleIconContainer>
          <div className="grid place-items-center px-3 w-full gap-y-5">
            <h1 className="text-grey-900 text-2xl font-[550]">Are you sure?</h1>
            <p className="text-grey-500 text-sm text-center">
              Are you sure you want to proceed with deleting this action? Please
              be aware that this action is irreversible, and all associated data
              will be permanently lost.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-5">
            <DecoratedButton
              type="submit"
              variant="danger"
              className="w-full bg-system-error-100"
              onClick={deleteAction}
              disabled={deleteActionLoading}
            >
              Delete Action
            </DecoratedButton>

            <DecoratedButton
              type="submit"
              className="w-full"
              onClick={() => setOpenDeleteModal(false)}
            >
              Keep Action
            </DecoratedButton>
          </div>
        </DialogPanel>
      </Dialog>

      <div className="w-1/2 grid grid-cols-1 gap-y-10">
        <div className="grid gap-y-2">
          <h1 className="text-grey-900 text-lg font-[550]">Danger Zone</h1>
          <p className="text-grey-500">
            This will immediately and permanently delete <b>{action.name}</b>{" "}
            and its data for everyone. This cannot be undone.
          </p>
        </div>
        <DecoratedButton
          type="button"
          variant="danger"
          onClick={() => setOpenDeleteModal(true)}
          disabled={deleteActionLoading}
          className="bg-system-error-100 w-40 "
        >
          Delete action
        </DecoratedButton>
      </div>
    </div>
  );
};
