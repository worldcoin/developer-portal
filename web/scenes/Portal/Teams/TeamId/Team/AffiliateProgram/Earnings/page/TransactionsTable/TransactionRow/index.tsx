import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateTransactionsResponse } from "@/lib/types";
import dayjs from "dayjs";
import { TransactionBadge } from "../TransactionBadge";

const TITLE_MAP: Record<AffiliateTransactionsResponse[0]["type"], string> = {
  affiliateAccumulationOrb: "Orb reward",
  affiliateAccumulationNfc: "ID reward",
  affiliateWithdrawal: "Withdrawal",
};

export const TransactionRow = (props: {
  transaction: AffiliateTransactionsResponse[0];
  index: number;
  onClick: () => void;
}) => {
  const { transaction, index } = props;

  const formatAmount = (amount: string, token: string) => {
    if (token === "USDCE") {
      return (parseFloat(amount) / 10 ** 6).toFixed(2);
    } else if (token === "WLD") {
      return (parseFloat(amount) / 10 ** 18).toFixed(2);
    }
  };

  return (
    <tr onClick={props.onClick}>
      <td key={`transaction_${index}_0`} className="border-b border-grey-200">
        <div className="flex items-center gap-x-4 px-2 py-3">
          <TransactionBadge
            transaction={transaction}
            className="size-12"
            iconClassName="size-6"
          />
          <div className="flex flex-col">
            <Typography variant={TYPOGRAPHY.R3}>
              {TITLE_MAP[transaction.type]}
            </Typography>
            <Typography variant={TYPOGRAPHY.R5} className="text-gray-400">
              {dayjs(transaction.date).format("DD MMM, HH:mm")}
            </Typography>
          </div>
        </div>
      </td>

      <td key={`transaction_${index}_1`} className="border-b border-grey-200">
        <div className="flex flex-col items-end px-2 py-3">
          <Typography variant={TYPOGRAPHY.R3}>
            {formatAmount(transaction.amount.inWLD, "WLD")} WLD
          </Typography>
          <Typography variant={TYPOGRAPHY.R5} className="text-gray-400">
            ${transaction.amount.inCurrency}
          </Typography>
        </div>
      </td>
    </tr>
  );
};
