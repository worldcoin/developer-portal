"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
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

        <DialogPanel className="grid gap-y-8 md:max-w-[32rem]">
          <CircleIconContainer variant={"error"}>
            <CloseIcon
              className="size-5 text-system-error-600"
              strokeWidth={3}
            />
          </CircleIconContainer>

          <div className="grid w-full items-center justify-center gap-y-4">
            <Typography
              variant={TYPOGRAPHY.H6}
              className="text-center text-grey-900"
            >
              App was rejected
            </Typography>

            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-center text-grey-500 "
            >
              Unfortunately, your app was evaluated by our team, and it was
              rejected for the following reason. <br />
              <b>Questions? Reachout on Telegram @MateoSauton</b>
            </Typography>
          </div>

          <div className="w-full rounded-lg border border-grey-200 bg-grey-25 px-5 py-4">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-400">
              {message}
            </Typography>
          </div>

          <div className="grid w-full grid-cols-2 gap-x-4">
            <DecoratedButton
              type="button"
              variant="secondary"
              onClick={() => setIsOpened(false)}
            >
              Cancel
            </DecoratedButton>

            <DecoratedButton onClick={removeAndClose} type="button">
              Resolve issues
            </DecoratedButton>
          </div>
        </DialogPanel>
      </Dialog>
    );
  }
};
