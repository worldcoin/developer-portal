"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateBalanceResponse, Auth0SessionUser } from "@/lib/types";
import {
  checkUserPermissions,
  formatTokenAmount,
  toFixedAmount,
} from "@/lib/utils";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Role_Enum } from "@/graphql/graphql";
import { WalletPocketIcon } from "@/components/Icons/WallenPocketIcon";

type Props = {
  loading: boolean;
  data: AffiliateBalanceResponse | null;
};

export const EarningsHeader = (props: Props) => {
  const { data, loading } = props;
  const { teamId } = useParams() as { teamId: string };
  const router = useRouter();
  const { user: auth0User } = useUser() as Auth0SessionUser;

  const hasWithdrawPermissions = useMemo(() => {
    return checkUserPermissions(auth0User, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [auth0User, teamId]);

  const formattedWldAmount = useMemo(() => {
    if (!data?.availableBalance) return null;
    return formatTokenAmount(data?.availableBalance.inWLD, "WLD");
  }, [data?.availableBalance]);

  const formattedUsdAmount = useMemo(() => {
    if (loading) {
      return <Skeleton width={200} />;
    }
    if (data?.availableBalance.inCurrency != null) {
      return (
        "Available to withdraw · $" +
        toFixedAmount(data?.availableBalance.inCurrency)
      );
    }
    return "No funds to withdraw";
  }, [loading, formattedWldAmount]);

  return (
    <div className="grid items-center gap-y-4 border-b border-dashed border-grey-200 py-10 sm:grid-cols-auto/1fr/auto sm:justify-items-start sm:gap-x-6">
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

        <Typography
          variant={TYPOGRAPHY.R3}
          className="text-grey-500 max-md:text-base max-md:leading-6"
        >
          {formattedUsdAmount}
        </Typography>
      </div>

      {hasWithdrawPermissions && (
        <div className="flex items-center gap-3 sm:grid-cols-auto/1fr">
          {props.loading ? (
            <Skeleton width={122} height={48} className="rounded-xl" />
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
      )}
    </div>
  );
};
