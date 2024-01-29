"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import Link from "next/link";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { useActionQuery } from "../../graphql/get-single-action.generated";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { Dialog } from "@/components/Dialog";
import { useCallback, useState } from "react";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { useDeleteActionMutation } from "../../../graphql/delete-action.generated";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type ActionIdDangerPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionIdDangerPage = ({ params }: ActionIdDangerPageProps) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const actionID = params?.actionId;
  const router = useRouter();

  const [deleteActionQuery, { loading: deleteActionLoading }] =
    useDeleteActionMutation({});

  const { data, loading } = useActionQuery({
    variables: { action_id: actionID ?? "" },
  });
  const action = data?.action[0];

  const deleteAction = useCallback(async () => {
    try {
      const result = await deleteActionQuery({
        variables: { id: actionID ?? "" },
      });
      if (result instanceof Error) {
        throw result;
      }
      router.push(".."); // TODO: Need to refetch action list to update, waiting till we decide on state
    } catch (error) {
      console.error(error);
      return toast.error("Unable to delete action");
    }
    toast.success(`${action?.name} was deleted.`);
  }, []);

  if (loading || !action) {
    return <div></div>;
  } else {
    return (
      <div className="w-full h-full flex flex-col items-center ">
        <Dialog
          open={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
        >
          <DialogOverlay />
          <DialogPanel className="rounded-x bg-white mx-auto w-5 grid gap-y-6">
            <CircleIconContainer variant={"error"}>
              <AlertIcon />
            </CircleIconContainer>
            <div className="grid place-items-center px-3 w-full gap-y-5">
              <h1 className="text-grey-900 text-2xl font-[550]">
                Are you sure?
              </h1>
              <p className="text-grey-500 text-sm text-center">
                Are you sure you want to proceed with deleting this action?
                Please be aware that this action is irreversible, and all
                associated data will be permanently lost.
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
        <div className="grid gap-y-2 max-w-[1180px] w-full py-10">
          <div>
            <Link href=".." className="flex flex-row items-center gap-x-2">
              <CaretIcon className="h-3 w-3 text-grey-400 rotate-90" />
              <p className="text-grey-700 font-[400] text-xs">
                Back to Incognito Actions
              </p>
            </Link>
          </div>
          <div className="w-full flex justify-between items-center">
            <h1 className="text-grey-900 text-2xl font-[550] capitalize">
              {action.name}
            </h1>
            <DecoratedButton
              variant="secondary"
              href="https://docs.worldcoin.org/id/incognito-actions"
              className="text-grey-700 py-3 px-7 "
            >
              <DocsIcon />
              Learn more
            </DecoratedButton>
          </div>
          <hr className="my-5 w-full text-grey-200 border-dashed" />
          <div className="w-1/2 grid grid-cols-1 gap-y-10">
            <div className="grid gap-y-2">
              <h1 className="text-grey-900 text-lg font-[550]">Danger Zone</h1>
              <p className="text-grey-500">
                This will immediately and permanently delete{" "}
                <b>{action.name}</b> and its data for everyone. This cannot be
                undone.
              </p>
            </div>
            <DecoratedButton
              type="button"
              variant="danger"
              onClick={() => setOpenDeleteModal(true)}
              className="bg-system-error-100 w-40 "
            >
              Delete action
            </DecoratedButton>
          </div>
        </div>
      </div>
    );
  }
};
