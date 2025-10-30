import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateTransactionsResponse } from "@/lib/types";
import dayjs from "dayjs";
import { TransactionBadge } from "../TransactionBadge";
import clsx from "clsx";

const TITLE_MAP: Record<
  AffiliateTransactionsResponse["transactions"][0]["type"],
  string
> = {
  affiliateAccumulationOrb: "Orb reward",
  affiliateAccumulationNfc: "ID reward",
  affiliateWithdrawal: "Withdrawal",
};

export const TransactionRow = (props: {
  transaction: AffiliateTransactionsResponse["transactions"][0];
  onClick: () => void;
}) => {
  const { transaction } = props;

  const formatAmount = (amount: string, token: string) => {
    if (token === "USDCE") {
      return (parseFloat(amount) / 10 ** 6).toFixed(2);
    } else if (token === "WLD") {
      return (parseFloat(amount) / 10 ** 18).toFixed(2);
    }
  };

  const isIncome =
    transaction.type === "affiliateAccumulationNfc" ||
    transaction.type === "affiliateAccumulationOrb";

  return (
    <tr onClick={props.onClick}>
      <td className="border-b border-grey-200">
        <div className="flex items-center gap-x-4 px-2 py-3">
          <TransactionBadge
            transaction={transaction}
            className="size-12"
            iconClassName="size-6"
            hideStatusIcon
          />
          <div className="flex flex-col">
            <Typography variant={TYPOGRAPHY.R3}>
              {TITLE_MAP[transaction.type]}
            </Typography>
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
              {dayjs(transaction.date).format("DD MMM, HH:mm")}
            </Typography>
          </div>
        </div>
      </td>

      <td className="border-b border-grey-200">
        <div className="flex flex-col items-end px-2 py-3">
          <Typography
            variant={TYPOGRAPHY.R3}
            className={clsx({
              "text-system-success-700": isIncome,
            })}
          >
            {isIncome && <span>+</span>}
            {formatAmount(transaction.amount.inWLD, "WLD")} WLD
          </Typography>
          <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
            ${transaction.amount.inCurrency}
          </Typography>
        </div>
      </td>
    </tr>
  );
};
