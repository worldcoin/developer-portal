"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CopySquareIcon } from "@/components/Icons/CopySquareIcon";
import { WalletIcon } from "@/components/Icons/WalletIcon";
import { WLDIcon } from "@/components/Icons/WLDIcon";
import { WLDTokenIcon } from "@/components/Icons/WLDTokenIcon";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { formatWalletAddress } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { WithdrawFormData } from "../common/types";

export type Props = {
  onConfirm: () => void;
  isLoading: boolean; // Add this prop
};

export const ConfirmTransaction = (props: Props) => {
  const { onConfirm, isLoading } = props;
  const {
    watch,
    formState: { errors },
  } = useFormContext<WithdrawFormData>();
  const walletAddress = watch("walletAddress");
  const amount = watch("amount");

  // Check if form data is valid
  const isFormValid =
    walletAddress && amount && !errors.walletAddress && !errors.amount;

  return (
    <div className="mt-8 grid w-full max-w-[380px] place-items-center gap-8 justify-self-center">
      <Typography variant={TYPOGRAPHY.H6}>Confirm withdrawal</Typography>

      <div className="grid w-full gap-1.5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#00C230]">
            <WalletIcon className="size-[26px] text-white" />
          </div>
          <div>
            <Typography as="p" variant={TYPOGRAPHY.M3}>
              Withdrawal
            </Typography>
            <Typography
              as="p"
              variant={TYPOGRAPHY.R4}
              className="text-gray-500"
            >
              from earnings
            </Typography>
          </div>
          <Typography variant={TYPOGRAPHY.M2} className="flex-1 text-right">
            {amount ? `${amount} WLD` : "0 WLD"}
          </Typography>
        </div>

        {/* Connecting line between the two boxes */}
        <div className="ml-6 h-6 w-[1px] bg-gray-300"></div>

        <div className="flex items-center gap-3">
          <WLDTokenIcon className="size-12" />
          <div>
            <Typography as="p" variant={TYPOGRAPHY.M3}>
              Receive
            </Typography>
            <Typography
              as="p"
              variant={TYPOGRAPHY.R4}
              className="text-gray-500"
            >
              to World App
            </Typography>
          </div>
          <Typography variant={TYPOGRAPHY.M2} className="flex-1 text-right">
            {amount ? `${amount} WLD` : "0 WLD"}
          </Typography>
        </div>
      </div>

      <div className="flex w-full flex-col gap-5 border-y border-gray-100 py-6">
        <div className="flex justify-between gap-2">
          <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
            Provider fee
          </Typography>
          <Typography variant={TYPOGRAPHY.M4}>Free</Typography>
        </div>

        <div className="flex justify-between gap-2">
          <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
            Wallet address
          </Typography>
          <Typography
            variant={TYPOGRAPHY.M4}
            className="flex items-center gap-1"
          >
            {formatWalletAddress(walletAddress)}
            <button
              type="button"
              className="outline-0"
              onClick={() => {
                if (!walletAddress) return;
                navigator.clipboard.writeText(walletAddress);
                toast.success(`wallet address copied to clipboard`);
              }}
            >
              <CopySquareIcon className="size-5 text-gray-500" />
            </button>
          </Typography>
        </div>

        <div className="flex justify-between gap-2">
          <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
            Network
          </Typography>

          <div className="flex items-center gap-1">
            <WLDIcon className="size-5" />
            <Typography variant={TYPOGRAPHY.M4}>World Chain</Typography>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6">
        <Typography
          variant={TYPOGRAPHY.R5}
          className="text-center text-gray-500"
        >
          Please verify that all information supplied is correct,
          <br />
          as completed transactions are irreversible.
        </Typography>
        <DecoratedButton
          type="button"
          variant="primary"
          className="w-full"
          disabled={!isFormValid || isLoading}
          onClick={onConfirm}
        >
          Confirm
        </DecoratedButton>
      </div>
    </div>
  );
};
