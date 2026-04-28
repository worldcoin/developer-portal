"use client";

import { Button } from "@/components/Button";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { Dialog } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  GetIdentityVerificationLinkRequest,
  IdentityVerificationStatus,
} from "@/lib/types";
import clsx from "clsx";
import { VerificationStep } from "../KybStep";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (type: GetIdentityVerificationLinkRequest["type"]) => void;
  isLoading: boolean;
};

export const SelectVerificationDialog = ({
  open,
  onClose,
  onSelect,
  isLoading,
}: Props) => {
  return (
    <Dialog open={open} onClose={onClose} className="z-50">
      <DialogPanel className={clsx("fixed inset-0 overflow-y-scroll p-0")}>
        <header className="fixed z-10 max-h-[56px] w-full border-b border-grey-100 bg-white py-4">
          <SizingWrapper>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <Button type="button" onClick={onClose} className="flex">
                  <CloseIcon className="size-4" />
                </Button>
                <span className="text-grey-200">|</span>
                <Typography variant={TYPOGRAPHY.M4}>
                  Identity verification
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
              <div className="grid justify-items-center gap-y-8">
                <CircleIconContainer variant="info">
                  <IdentificationIcon className="size-7 text-blue-500" />
                </CircleIconContainer>

                <div className="grid gap-y-3 text-center">
                  <Typography variant={TYPOGRAPHY.H6}>
                    Select verification
                  </Typography>
                  <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                    In order to withdraw funds, you need
                    <br />
                    to complete verification
                  </Typography>
                </div>
              </div>

              <div className="mt-10 w-full shadow-[0px_1px_1px_0px_rgba(25,28,32,0.06)]">
                <VerificationStep
                  verificationType="kyc"
                  status={IdentityVerificationStatus.NOT_STARTED}
                  onComplete={() => onSelect("kyc")}
                  isLoading={isLoading}
                  buttonText="Start"
                  className="border-grey-200"
                />
                <VerificationStep
                  verificationType="kyb"
                  status={IdentityVerificationStatus.NOT_STARTED}
                  onComplete={() => onSelect("kyb")}
                  isLoading={isLoading}
                  buttonText="Start"
                  className="border-grey-200"
                />
              </div>
            </div>
          </SizingWrapper>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
