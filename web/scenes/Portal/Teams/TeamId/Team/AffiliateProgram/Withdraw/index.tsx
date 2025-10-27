"use client";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useGetAffiliateBalance } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/hooks/use-get-affiliate-balance";
import { AffiliateWithdrawStep } from "./common/types";
import { ConfirmTransaction } from "./ConfirmTransaction";
import { EnterAmount } from "./EnterAmount";
import { EnterCode } from "./EnterCode";
import { EnterWalletAddress } from "./EnterWalletAddress";
import { WithdrawSuccess } from "./WithdrawSuccess";
import { WorldChainDialog, worldChainDialogAtom } from "./WorldChainDialog";
import clsx from "clsx";
import { useAtom } from "jotai/index";
import Link from "next/link";
import { useState } from "react";
import { InitiateWithdrawResponse } from "@/lib/types";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { confirmWithdraw } from "./server/confirmWithdraw";
import { initiateWithdraw } from "./server/initiateWithdraw";
import { toast } from "react-toastify";

// Define form schema
const withdrawSchema = yup.object({
  walletAddress: yup
    .string()
    .required("Wallet address is required")
    .matches(/^0x[a-fA-F0-9]{40}$/, "Incorrect address"),
  amount: yup
    .number()
    .required("Amount is required")
    .min(0.01, "Minimum amount is 0.01 WLD")
    .typeError("Please enter a valid number"),
  otpCode: yup
    .string()
    .required("OTP code is required")
    .length(6, "OTP code must be 6 digits")
    .matches(/^\d{6}$/, "OTP code must be 6 digits"),
});

type WithdrawFormData = yup.InferType<typeof withdrawSchema>;

type PageProps = {
  params: {
    teamId: string;
  };
};

export const WithdrawPage = (props: PageProps) => {
  const { params } = props;
  const teamId = params?.teamId;
  const { data: balanceData, loading: isBalanceLoading } =
    useGetAffiliateBalance();
  const [currentStep, setCurrentStep] = useState<AffiliateWithdrawStep>(
    AffiliateWithdrawStep.ENTER_WALLET_ADDRESS,
  );
  const [_, setIsOpened] = useAtom(worldChainDialogAtom);
  const [withdrawalResponse, setWithdrawalResponse] =
    useState<InitiateWithdrawResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Setup form
  const methods = useForm<WithdrawFormData>({
    resolver: yupResolver(withdrawSchema),
    defaultValues: {
      walletAddress: "",
      amount: 0,
      otpCode: "",
    },
    mode: "onBlur",
  });

  const { watch } = methods;

  const onWithdrawInitiate = async () => {
    setIsLoading(true);

    try {
      const data = watch();
      // Convert amount to Wei
      const amountInWld = (data.amount * Math.pow(10, 18)).toString();

      const result = await initiateWithdraw({
        amountInWld,
        toWallet: data.walletAddress,
      });

      setWithdrawalResponse(result.data as InitiateWithdrawResponse);
      setCurrentStep(AffiliateWithdrawStep.ENTER_CODE);
    } catch (error) {
      console.error("Withdrawal initiation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add confirmation handler
  const onWithdrawConfirm = async () => {
    if (!withdrawalResponse) {
      toast.error("No withdrawal request found");
      return;
    }

    try {
      setIsLoading(true);
      const data = watch();
      await confirmWithdraw({
        withdrawalRequestId: withdrawalResponse.withdrawalId,
        emailConfirmationCode: data.otpCode,
      });

      setCurrentStep(AffiliateWithdrawStep.SUCCESS);
    } catch (error) {
      console.error("Withdrawal confirmation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <SizingWrapper
        gridClassName="order-2 grow mt-10"
        className="gap flex flex-col"
      >
        <Link
          href={`/teams/${teamId}/affiliate-program/earnings`}
          className="flex flex-row items-center gap-x-2"
        >
          <CaretIcon className="size-3 rotate-90 text-grey-400" />
          <Typography variant={TYPOGRAPHY.R5} className="text-grey-700">
            Back to Earnings
          </Typography>
        </Link>

        <div
          className={clsx({
            "grid h-full place-items-center":
              currentStep === AffiliateWithdrawStep.SUCCESS,
          })}
        >
          <WorldChainDialog
            onConfirm={() => {
              setCurrentStep(AffiliateWithdrawStep.ENTER_AMOUNT);
              setIsOpened(false);
            }}
            onClose={() => setIsOpened(false)}
          />
          {currentStep === AffiliateWithdrawStep.ENTER_WALLET_ADDRESS && (
            <EnterWalletAddress
              onConfirm={() => setIsOpened(true)}
              loading={isBalanceLoading}
            />
          )}
          {currentStep === AffiliateWithdrawStep.ENTER_AMOUNT &&
            balanceData && (
              <EnterAmount
                balance={balanceData}
                onConfirm={() => setCurrentStep(AffiliateWithdrawStep.CONFIRM)}
              />
            )}
          {currentStep === AffiliateWithdrawStep.CONFIRM && (
            <ConfirmTransaction
              onConfirm={onWithdrawInitiate}
              isLoading={isLoading}
            />
          )}
          {currentStep === AffiliateWithdrawStep.ENTER_CODE && (
            <EnterCode
              onConfirm={onWithdrawConfirm}
              onRetry={onWithdrawInitiate}
              isLoading={isLoading}
            />
          )}
          {currentStep === AffiliateWithdrawStep.SUCCESS && <WithdrawSuccess />}
        </div>
      </SizingWrapper>
    </FormProvider>
  );
};
