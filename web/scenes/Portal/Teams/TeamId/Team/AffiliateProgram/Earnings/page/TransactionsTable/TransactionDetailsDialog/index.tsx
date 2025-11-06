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
import {
  createTransactionHashUrl,
  formatTokenAmount,
  formatWalletAddress,
} from "@/lib/utils";
import { atom, useAtom } from "jotai";
import Link from "next/link";
import { toast } from "react-toastify";
import { TransactionBadge } from "../TransactionBadge";

const statusMap: Record<
  AffiliateTransactionsResponse["transactions"][0]["status"],
  string
> = {
  pending: "Processing",
  mined: "Completed",
  failed: "Failed",
};

const TITLE_MAP: Record<
  AffiliateTransactionsResponse["transactions"][0]["type"],
  string
> = {
  affiliateAccumulationOrb: "Orb reward",
  affiliateAccumulationNfc: "ID reward",
  affiliateWithdrawal: "Withdrawal",
};

export const transactionDetailsDialogAtom = atom(false);

type Props = {
  data: AffiliateTransactionsResponse["transactions"][0];
  onClose: () => void;
};
export const TransactionDetailsDialog = (props: Props) => {
  const [isOpened, setIsOpened] = useAtom(transactionDetailsDialogAtom);

  return (
    <Dialog
      open={isOpened}
      onClose={() => {
        setIsOpened(false);
        props.onClose();
      }}
    >
      <DialogOverlay />

      <DialogPanel
        className="grid w-full md:w-[480px]"
        onClose={() => setIsOpened(false)}
        showCloseIcon={true}
      >
        <TransactionBadge
          transaction={props.data!}
          className="size-16"
          iconClassName="size-8"
        />

        <div className="mt-6 grid justify-items-center gap-1">
          <Typography variant={TYPOGRAPHY.H6}>
            {TITLE_MAP[props.data.type]}
          </Typography>

          <div className="flex items-center gap-0.5">
            <WorldIcon className="size-[38px]" />
            <Typography variant={TYPOGRAPHY.H3}>
              {formatTokenAmount(props.data.amount.inWLD, "WLD")}
            </Typography>
          </div>

          <Typography
            variant={TYPOGRAPHY.M2}
            className="text-center text-grey-500"
          >
            ${props.data.amount.inCurrency.toFixed(2)}
          </Typography>
        </div>

        <div className="my-10 w-full border-t border-grey-100" />
        {props.data.type === "affiliateAccumulationOrb" && (
          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            Reward received for inviting a human
            <br />
            who verified with an Orb
          </Typography>
        )}

        {props.data.type === "affiliateAccumulationNfc" && (
          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            Reward received for inviting a human
            <br /> who verified with an ID
          </Typography>
        )}
        {props.data.type === "affiliateWithdrawal" && (
          <div className="grid w-full gap-5">
            <div className="flex justify-between gap-2">
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                Status
              </Typography>
              <Typography variant={TYPOGRAPHY.M4}>
                {statusMap[props.data.status]}
              </Typography>
            </div>

            <div className="flex justify-between gap-2">
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                Provider fee
              </Typography>
              <Typography variant={TYPOGRAPHY.M4}>Free</Typography>
            </div>

            {props.data.walletAddress && (
              <div className="flex justify-between gap-2">
                <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                  Wallet address
                </Typography>
                <Typography
                  variant={TYPOGRAPHY.M4}
                  className="flex items-center gap-1"
                >
                  {formatWalletAddress(props.data.walletAddress)}
                  <button
                    type="button"
                    className="outline-0"
                    onClick={() => {
                      if (!props.data.walletAddress) return;
                      navigator.clipboard.writeText(props.data.walletAddress);
                      toast.success(`wallet address copied to clipboard`);
                    }}
                  >
                    <CopySquareIcon className="size-5 text-grey-500" />
                  </button>
                </Typography>
              </div>
            )}

            <div className="flex justify-between gap-2">
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                Network
              </Typography>

              <div className="flex items-center gap-1">
                <WLDIcon className="size-5" />
                <Typography variant={TYPOGRAPHY.M4}>World Chain</Typography>
              </div>
            </div>

            {props.data?.transactionHash && props.data.network && (
              <div className="flex justify-between gap-2">
                <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                  Hash
                </Typography>
                <Link
                  href={createTransactionHashUrl(
                    props.data?.transactionHash,
                    props.data?.network,
                  )}
                  target="_blank"
                  className="flex items-center gap-x-2 text-grey-500 outline-0"
                >
                  <Typography variant={TYPOGRAPHY.M4} className="truncate">
                    Details on blockchain
                  </Typography>
                  <OpenNewWindowIcon className="size-5 text-grey-500" />
                </Link>
              </div>
            )}
          </div>
        )}
      </DialogPanel>
    </Dialog>
  );
};
