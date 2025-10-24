"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateBalanceResponse } from "@/lib/types";
import { formatTokenAmount } from "@/lib/utils";
import tokenWalletImage from "public/images/token-wallet.png";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { useAtom } from "jotai/index";
import { transactionDetailsDialogAtom } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/TransactionsTable/TransactionDetailsDialog";
import { useParams, useRouter } from "next/navigation";

type Props = {
  loading: boolean;
  data: AffiliateBalanceResponse | null;
};

export const EarningsHeader = (props: Props) => {
  const { data, loading } = props;
  const { teamId } = useParams() as { teamId: string };
  const router = useRouter();

  const formattedWldAmount = useMemo(() => {
    if (!data?.availableBalance) return null;
    return formatTokenAmount(data?.availableBalance, "WLD");
  }, [data?.availableBalance]);

  const amountText = useMemo(() => {
    if (loading) {
      return <Skeleton width={200} />;
    }
    if (formattedWldAmount != null) {
      return "Available to withdraw · " + formattedWldAmount + " WLD";
    }
    return "No funds to withdraw";
  }, [loading, formattedWldAmount]);

  return (
    <div className="grid items-center justify-items-center gap-y-4 border-b border-dashed border-gray-200 py-10 sm:grid-cols-auto/1fr/auto sm:justify-items-start sm:gap-x-6">
      {/*<EnvelopeIcon className="size-15" />*/}
      <img src={tokenWalletImage.src} className="size-15" alt="wallet" />

      <div className="flex flex-col gap-y-1">
        <div className="flex items-baseline gap-0.5">
          <WorldIcon className="size-5" />
          {loading && <Skeleton width={60} />}
          {!loading && (
            <Typography variant={TYPOGRAPHY.H6}>
              {formattedWldAmount}
            </Typography>
          )}
        </div>

        <Typography
          variant={TYPOGRAPHY.R3}
          className="text-gray-500 max-md:text-base max-md:leading-6"
        >
          {amountText}
        </Typography>
      </div>

      <div className="grid w-full grid-cols-1 items-center gap-3 sm:grid-cols-auto/1fr">
        {props.loading ? (
          <Skeleton width={193} height={48} className="rounded-xl" />
        ) : (
          <DecoratedButton
            type="button"
            variant="primary"
            onClick={() =>
              router.push(`/teams/${teamId}/affiliate-program/withdraw`)
            }
            className="h-12"
          >
            Withdraw
          </DecoratedButton>
        )}
      </div>
    </div>
  );
};
