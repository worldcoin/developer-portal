"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { WalletPocketIcon } from "@/components/Icons/WallenPocketIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { AffiliateBalanceResponse, Auth0SessionUser } from "@/lib/types";
import {
  checkUserPermissions,
  formatTokenAmount,
  toFixedAmount,
} from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";

type Props = {
  loading: boolean;
  data: AffiliateBalanceResponse["result"] | null;
  onWithdrawClick?: () => void;
};

export const EarningsHeader = (props: Props) => {
  const { data, loading } = props;
  const { teamId } = useParams() as { teamId: string };
  const router = useRouter();
  const { user: auth0User } = useUser() as Auth0SessionUser;

  const isAllowedToWithdraw = useMemo(() => {
    return checkUserPermissions(auth0User, teamId ?? "", [Role_Enum.Owner]);
  }, [auth0User, teamId]);

  const formattedWldAmount = useMemo(() => {
    if (!data?.availableBalance) return null;
    return formatTokenAmount(data?.availableBalance.inWLD, "WLD");
  }, [data?.availableBalance]);

  const formattedUsdAmount = useMemo(() => {
    if (loading) {
      return <Skeleton width={200} />;
    }
    if (data?.availableBalance?.inCurrency != null) {
      return (
        "Available to withdraw · $" +
        toFixedAmount(data?.availableBalance?.inCurrency)
      );
    }
    return "No funds to withdraw";
  }, [loading, data?.availableBalance?.inCurrency]);

  const handleWithdrawClick = useCallback(() => {
    if (props.onWithdrawClick) {
      props.onWithdrawClick();
      return;
    }
    if (!data) {
      return;
    }
    if (!data?.withdrawalWallet?.trim()) {
      toast.error(
        "Missing wallet address for withdrawals. Complete your KYB to add a withdrawal wallet address, or contact support for assistance.",
      );
      return;
    }
    const isBelowMin =
      data?.minimumWithdrawal != null &&
      data?.availableBalance?.inWLD != null &&
      BigInt(data.availableBalance.inWLD) < BigInt(data.minimumWithdrawal);
    if (isBelowMin) {
      const minWldDisplay = formatTokenAmount(data.minimumWithdrawal, "WLD");
      toast.error(
        `Available balance is below the minimum withdrawal amount (min ${minWldDisplay} WLD). Please accumulate more rewards before withdrawing.`,
      );
      return;
    }
    router.push(`/teams/${teamId}/affiliate-program/withdraw`);
  }, [data, props.onWithdrawClick, router, teamId]);

  return (
    <div className="grid items-center gap-y-4 border-b border-dashed border-grey-200 pb-8 pt-4 sm:grid-cols-auto/1fr/auto sm:justify-items-start sm:gap-x-6 md:pt-10">
      <WalletPocketIcon className="hidden size-15 md:block" />

      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-0.5">
          <WorldIcon className="size-5" />
          {loading && <Skeleton width={60} height={25} />}
          {!loading && (
            <Typography variant={TYPOGRAPHY.H6}>
              {formattedWldAmount}
            </Typography>
          )}
        </div>

        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          {formattedUsdAmount}
        </Typography>
      </div>

      {isAllowedToWithdraw && (
        <div className="flex items-center gap-3 sm:grid-cols-auto/1fr">
          {props.loading ? (
            <Skeleton width={122} height={48} className="rounded-xl" />
          ) : (
            <DecoratedButton
              type="button"
              variant="primary"
              onClick={handleWithdrawClick}
              className="w-full"
              disabled={!data}
            >
              Withdraw
            </DecoratedButton>
          )}
        </div>
      )}
    </div>
  );
};
