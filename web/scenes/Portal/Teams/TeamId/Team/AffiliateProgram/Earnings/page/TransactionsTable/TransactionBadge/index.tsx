import { BankIcon } from "@/components/Icons/BankIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { AffiliateTransactionsResponse } from "@/lib/types";
import { clsx } from "clsx";
import { useMemo } from "react";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { FailedIcon } from "@/components/Icons/FailedIcon";
import { SuccessCheckIcon } from "@/components/Icons/SuccessCheckIcon";

export const TransactionBadge = (props: {
  transaction: AffiliateTransactionsResponse["transactions"][0] | null;
  className?: string;
  iconClassName?: string;
}) => {
  const { transaction } = props;

  const icon = useMemo(() => {
    if (transaction?.type === "affiliateAccumulationOrb") {
      return <WorldIcon className={clsx("size-6", props.iconClassName)} />;
    } else if (transaction?.type === "affiliateAccumulationNfc") {
      return <WorldIcon className={clsx("size-6", props.iconClassName)} />;
    } else if (transaction?.type === "affiliateWithdrawal") {
      return <BankIcon className={clsx("size-6", props.iconClassName)} />;
    }
  }, [transaction, props.iconClassName]);

  const statusIcon = useMemo(() => {
    if (props.transaction?.type !== "affiliateWithdrawal") return null;
    switch (props.transaction?.status) {
      case "mined":
        return <SuccessCheckIcon className="size-5 text-green-500" />;
      case "pending":
        return <SpinnerIcon className="size-5 animate-spin" />;
      case "failed":
        return <FailedIcon className="size-5" />;
      default:
        return null;
    }
  }, [props.transaction?.status, props.transaction?.type]);

  if (!icon || !transaction) return null;

  return (
    <div className="relative">
      <IconFrame className={clsx("bg-grey-100", props.className)}>
        {icon}
      </IconFrame>
      {statusIcon && (
        <div className="absolute -bottom-1 -right-1 rounded-full p-0.5">
          {statusIcon}
        </div>
      )}
    </div>
  );
};
