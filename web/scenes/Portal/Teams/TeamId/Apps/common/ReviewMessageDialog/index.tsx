"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { ModalIcon } from "@/components/ModalIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { atom, useAtom } from "jotai";
import { ErrorPage } from "@/components/ErrorPage";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useGetVerificationDataQuery } from "../../AppId/page/graphql/client/get-verification-data.generated";
import { useRemoveFromReview } from "../hooks/use-remove-from-review";

export const reviewMessageDialogOpenedAtom = atom<boolean>(false);

export const ReviewMessageDialog = (props: {
  goTo?: string;
  appId: string;
}) => {
  const router = useRouter();
  const [isOpened, setIsOpened] = useAtom(reviewMessageDialogOpenedAtom);

  const { loading: loadingGetVerificationQuery, data } =
    useGetVerificationDataQuery({
      variables: {
        id: props.appId,
      },
    });

  const verificationData = useMemo(() => data?.app?.app_metadata?.[0], [data]);

  const { removeFromReview, loading } = useRemoveFromReview({
    metadataId: verificationData?.id,
  });

  const message = verificationData?.review_message;

  const closeModal = useCallback(() => {
    if (loading) {
      return;
    }

    setIsOpened(false);
  }, [loading, setIsOpened]);

  const removeAndClose = useCallback(() => {
    if (props.goTo) {
      router.push(props.goTo);
    } else {
      removeFromReview();
    }
    closeModal();
  }, [closeModal, props.goTo, removeFromReview, router]);

  if (!loadingGetVerificationQuery && !data?.app) {
    return <ErrorPage statusCode={404} title="App Not found"></ErrorPage>;
  } else {
    return (
      <Dialog onClose={closeModal} open={isOpened}>
        <DialogOverlay />

        <DialogPanel className="gap-y-10 p-8 md:max-w-[36rem]">
          {/* Icon + Copy */}
          <div className="grid grid-cols-1 justify-items-center gap-y-8 text-center">
            <ModalIcon variant="neutral">
              <CloseIcon className="size-8 text-white" strokeWidth={2} />
            </ModalIcon>

            <div className="grid gap-y-2">
              <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
                App was rejected
              </Typography>
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                Unfortunately, your app's review was evaluated by our Worldcoin
                team, and it was rejected due to the reason:
              </Typography>
            </div>
          </div>

          {/* Rejection Reason Box */}
          <div className="grid w-full gap-y-2 rounded-lg border border-grey-200 bg-grey-50 px-5 py-4 text-left">
            {message && (
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
                {message}
              </Typography>
            )}
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
              Please, fix the issues stated before and then apply for review
              again.
            </Typography>
          </div>

          <div className="grid w-full gap-4 md:grid-cols-2">
            <DecoratedButton
              type="button"
              variant="secondary"
              onClick={() => setIsOpened(false)}
            >
              <Typography variant={TYPOGRAPHY.R3}>Cancel</Typography>
            </DecoratedButton>

            <DecoratedButton onClick={removeAndClose} type="button">
              <Typography variant={TYPOGRAPHY.R3}>Resolve issues</Typography>
            </DecoratedButton>
          </div>
        </DialogPanel>
      </Dialog>
    );
  }
};
