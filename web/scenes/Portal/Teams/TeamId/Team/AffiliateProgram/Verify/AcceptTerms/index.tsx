"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { LegalIcon } from "@/components/Icons/LegalIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { acceptTermsText } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Verify/AcceptTerms/doc";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import clsx from "clsx";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Button } from "@/components/Button";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { toast } from "react-toastify";
import { executeAcceptTerms } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/executeAcceptTerms";
import { useState } from "react";

type Props = DialogProps & {
  onClose: () => void;
  onConfirm: () => void;
};

export const AcceptTermsDialog = (props: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const handleAcceptTerms = async () => {
    setIsLoading(true);

    try {
      console.log("execute accept terms");
      const result = await executeAcceptTerms();
      if (result.success) {
        console.log("accepted terms url", result);
        props.onConfirm();
      } else {
        throw new Error(result.message || "Failed to accept terms");
      }
    } catch (error) {
      console.error("Failed to accept terms:", error);
      toast.error("Failed request on accept terms. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} className="z-50 ">
      <DialogPanel
        className={clsx("fixed inset-0 overflow-y-scroll p-0", props.className)}
      >
        <header className="fixed z-10 max-h-[56px] w-full border-b border-grey-100 bg-white py-4">
          <SizingWrapper>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <Button type="button" onClick={props.onClose} className="flex">
                  <CloseIcon className="size-4" />
                </Button>
                <span className="text-grey-200">|</span>
                <Typography variant={TYPOGRAPHY.M4}>
                  Terms & Conditions
                </Typography>
              </div>
              <LoggedUserNav />
            </div>
          </SizingWrapper>
        </header>
        <div className="relative mt-14 grid w-full items-center pb-4">
          <SizingWrapper
            gridClassName="overflow-y-auto"
            className="flex items-start justify-center"
          >
            <div className="grid w-[480px] grid-cols-1 justify-items-center pt-12">
              <CircleIconContainer variant="info">
                <LegalIcon className="size-7 text-blue-500" />
              </CircleIconContainer>

              <div className="mt-6 grid justify-items-center gap-y-3">
                <Typography variant={TYPOGRAPHY.H6}>
                  Confirm terms and conditions
                </Typography>

                <Typography
                  variant={TYPOGRAPHY.R3}
                  className="text-center text-grey-500"
                >
                  In order to register for the Affiliate program, confirm that
                  you agree with the Terms and conditions
                </Typography>
              </div>

              <Typography
                as="p"
                variant={TYPOGRAPHY.R5}
                className="mt-8 h-[300px] w-full overflow-auto whitespace-pre-wrap rounded-2xl bg-grey-50 p-4 text-grey-500"
              >
                {acceptTermsText}
              </Typography>

              <DecoratedButton
                type="button"
                onClick={handleAcceptTerms}
                className="mt-10 w-full"
                disabled={isLoading}
              >
                I agree
              </DecoratedButton>
            </div>
          </SizingWrapper>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
