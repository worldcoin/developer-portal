"use client";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CopySquareIcon } from "@/components/Icons/CopySquareIcon";
import { OpenNewWindowIcon } from "@/components/Icons/OpenNewWindowIcon";
import { WLDIcon } from "@/components/Icons/WLDIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateTransactionsResponse } from "@/lib/types";
import { createTransactionHashUrl, formatTokenAmount } from "@/lib/utils";
import { atom, useAtom } from "jotai";
import Link from "next/link";
import { TransactionBadge } from "../TransactionBadge";
import { toast } from "react-toastify";

const statusMap: Record<AffiliateTransactionsResponse[0]["status"], string> = {
  pending: "Processing",
  mined: "Completed",
  failed: "Failed",
};

const TITLE_MAP: Record<AffiliateTransactionsResponse[0]["type"], string> = {
  affiliateAccumulationOrb: "Orb reward",
  affiliateAccumulationNfc: "ID reward",
  affiliateWithdrawal: "Withdrawal",
};

export const transactionDetailsDialogAtom = atom(false);

type Props = {
  data: AffiliateTransactionsResponse[0];
  onClose: () => void;
};
export const TransactionDetailsDialog = (props: Props) => {
  const [isOpened, setIsOpened] = useAtom(transactionDetailsDialogAtom);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog
      open={isOpened}
      onClose={() => {
        setIsOpened(false);
        props.onClose();
      }}
    >
      <DialogOverlay />

      <DialogPanel className="grid w-full md:w-[480px]">
        <TransactionBadge
          transaction={props.data!}
          className="size-16"
          iconClassName="size-8"
        />

        <div className="mt-6 grid justify-items-center gap-1.5">
          <Typography variant={TYPOGRAPHY.H4}>
            {TITLE_MAP[props.data.type]}
          </Typography>

          <div className="flex items-center gap-0.5">
            <WorldIcon className="size-[38px]" />
            <Typography variant={TYPOGRAPHY.H4}>
              {formatTokenAmount(props.data.amount.inWLD, "WLD")}
            </Typography>
          </div>

          <Typography
            variant={TYPOGRAPHY.S2}
            className="text-center text-gray-500"
          >
            ${props.data.amount.inCurrency}
          </Typography>
        </div>

        <div className="my-10 w-full border-t border-gray-100" />
        {props.data.type === "affiliateAccumulationOrb" && (
          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-gray-500"
          >
            Reward received for inviting a human
            <br />
            who verified with an Orb
          </Typography>
        )}

        {props.data.type === "affiliateAccumulationNfc" && (
          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-gray-500"
          >
            Reward received for inviting a human
            <br /> who verified with an ID
          </Typography>
        )}
        {props.data.type === "affiliateWithdrawal" && (
          <div className="grid w-full gap-5">
            <div className="flex justify-between gap-2">
              <Typography variant={TYPOGRAPHY.B3} className="text-gray-500">
                Status
              </Typography>
              <Typography variant={TYPOGRAPHY.S3}>
                {statusMap[props.data.status]}
              </Typography>
            </div>

            <div className="flex justify-between gap-2">
              <Typography variant={TYPOGRAPHY.B3} className="text-gray-500">
                Provider fee
              </Typography>
              <Typography variant={TYPOGRAPHY.S3}>Free</Typography>
            </div>

            <div className="flex justify-between gap-2">
              <Typography variant={TYPOGRAPHY.B3} className="text-gray-500">
                Wallet address
              </Typography>
              <Typography
                variant={TYPOGRAPHY.S3}
                className="flex items-center gap-1"
              >
                {/* TODO: use wallet address */}
                {formatAddress(props.data.walletAddress || "")}
                <button
                  type="button"
                  className="outline-0"
                  onClick={() => {
                    if (!props.data.walletAddress) return;
                    navigator.clipboard.writeText(props.data.walletAddress);
                    toast.success(`wallet address copied to clipboard`);
                  }}
                >
                  <CopySquareIcon className="size-5 text-gray-500" />
                </button>
              </Typography>
            </div>

            <div className="flex justify-between gap-2">
              <Typography variant={TYPOGRAPHY.B3} className="text-gray-500">
                Network
              </Typography>

              <div className="flex items-center gap-1">
                <WLDIcon className="size-5" />
                <Typography variant={TYPOGRAPHY.S3}>World Chain</Typography>
              </div>
            </div>

            {props.data?.transactionHash && props.data.network && (
              <div className="flex justify-between gap-2">
                <Typography variant={TYPOGRAPHY.B3} className="text-gray-500">
                  Hash
                </Typography>
                <Link
                  href={createTransactionHashUrl(
                    props.data?.transactionHash,
                    props.data?.network,
                  )}
                  target="_blank"
                  className="flex items-center gap-x-2 text-gray-400 outline-0"
                >
                  <Typography variant={TYPOGRAPHY.S3} className="truncate">
                    Details on blockchain
                  </Typography>
                  <OpenNewWindowIcon className="size-5 text-gray-400" />
                </Link>
              </div>
            )}
          </div>
        )}
      </DialogPanel>
    </Dialog>
  );
};
