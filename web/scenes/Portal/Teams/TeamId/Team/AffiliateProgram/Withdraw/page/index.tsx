"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { convertAmountToWei, parseTokenAmount } from "@/lib/utils";
import { useGetAffiliateBalance } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/hooks/use-get-affiliate-balance";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { confirmWithdraw } from "../server/confirmWithdraw";
import { initiateWithdraw } from "../server/initiateWithdraw";
import { AffiliateWithdrawStep } from "./common/types";
import { ConfirmTransaction } from "./ConfirmTransaction";
import { EnterAmount } from "./EnterAmount";
import { EnterCode } from "./EnterCode";
import { WithdrawSuccess } from "./WithdrawSuccess";

type WithdrawFormData = {
  walletAddress: string;
  amount: number;
  otpCode: string;
};

type PageProps = {
  params: {
    teamId: string;
  };
};

export const WithdrawPage = (props: PageProps) => {
  const { data: balanceData, loading: isBalanceLoading } =
    useGetAffiliateBalance();

  const [currentStep, setCurrentStep] = useState<AffiliateWithdrawStep>(
    AffiliateWithdrawStep.ENTER_AMOUNT,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Create dynamic schema based on balance data
  const withdrawSchema = useMemo(() => {
    return yup.object({
      walletAddress: yup.string().required("Wallet address is required"),
      amount: yup
        .number()
        .required("Amount is required")
        .when([], {
          is: () => !!balanceData,
          then: (schema) => {
            if (!balanceData) return schema;
            const minWithdrawWLD = parseTokenAmount(
              balanceData?.minimumWithdrawal,
              "WLD",
            );
            const maxWithdrawWLD = parseTokenAmount(
              balanceData?.maximumWithdrawal,
              "WLD",
            );
            if (!minWithdrawWLD || !maxWithdrawWLD) return schema;
            return schema
              .min(minWithdrawWLD, `Minimum amount is ${minWithdrawWLD} WLD`)
              .max(maxWithdrawWLD, `Maximum amount is ${maxWithdrawWLD} WLD`)
              .typeError("Please enter a valid number");
          },
        })
        .typeError("Please enter a valid number"),
      otpCode: yup
        .string()
        .required("OTP code is required")
        .length(6, "OTP code must be 6 digits")
        .matches(/^\d{6}$/, "OTP code must be 6 digits"),
    });
  }, [balanceData?.minimumWithdrawal, balanceData?.maximumWithdrawal]);

  // Setup form with dynamic schema
  const methods = useForm<WithdrawFormData>({
    resolver: yupResolver(withdrawSchema),
    mode: "onBlur",
  });

  const { watch } = methods;

  // When balanceData is fetched, set walletAddress in the form if present
  useEffect(() => {
    if (balanceData?.withdrawalWallet) {
      methods.setValue("walletAddress", balanceData.withdrawalWallet);
    }
  }, [balanceData?.withdrawalWallet]);

  const onWithdrawInitiate = async () => {
    setIsLoading(true);

    try {
      const data = watch();
      const amountInWldWei = convertAmountToWei(data.amount, "WLD");
      if (!amountInWldWei) {
        toast.error("Unable to initiate withdrawal. Please contact support.");
        return;
      }

      const result = await initiateWithdraw({
        amountInWld: amountInWldWei,
      });
      console.log("initiateWithdraw data", result, result.data);

      setCurrentStep(AffiliateWithdrawStep.ENTER_CODE);
    } catch (error) {
      console.error("Withdrawal initiation failed:", error);
      toast.error("Failed to initiate withdraw. Please try later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add confirmation handler
  const onWithdrawConfirm = async () => {
    try {
      setIsLoading(true);
      const data = watch();
      const result = await confirmWithdraw({
        emailConfirmationCode: data.otpCode,
      });
      console.log("confirmWithdraw data", result, result.data);

      setCurrentStep(AffiliateWithdrawStep.SUCCESS);
    } catch (error) {
      console.error("Withdrawal confirmation failed:", error);
      toast.error("Failed to withdraw. Please try later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <SizingWrapper
        gridClassName="order-2 grow mt-6 md:mt-10"
        className="gap flex flex-col"
      >
        <div className="flex h-full min-h-0 items-center justify-center">
          {currentStep === AffiliateWithdrawStep.ENTER_AMOUNT &&
            balanceData && (
              <EnterAmount
                balance={balanceData}
                onConfirm={() => setCurrentStep(AffiliateWithdrawStep.CONFIRM)}
                loading={isLoading || isBalanceLoading}
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
