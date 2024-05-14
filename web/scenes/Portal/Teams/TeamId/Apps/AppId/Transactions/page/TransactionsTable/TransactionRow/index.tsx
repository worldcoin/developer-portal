import { ExternalLinkIcon } from "@/components/Icons/ExternalLinkIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { TransactionMetadata } from "@/lib/types";
import { createTransactionHashUrl } from "@/lib/utils";
import Link from "next/link";
import { AddressArrow } from "./AddressArrow";
import { TransactionStatusBadge } from "./Status";
import { TokenIcon } from "./Token";

export const TransactionRow = (props: {
  transaction: TransactionMetadata;
  index: number;
}) => {
  const { transaction, index } = props;

  // This function should convert a valid ISO-8601 date string to a human-readable date string like this 5/08/2023 08:23 AM
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <tr>
      <td key={`transaction_${index}_0`} className="border-b border-grey-200">
        <div className="flex items-center gap-x-2">
          <TokenIcon token={transaction.inputToken} />
          <Typography variant={TYPOGRAPHY.R4}>
            {transaction.inputTokenAmount}
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
            {transaction.inputToken}
          </Typography>
        </div>
      </td>

      <td
        className=" items-center border-b border-grey-200"
        key={`transaction_${index}_1`}
      >
        <div className="px-2 py-3">
          <Typography variant={TYPOGRAPHY.R4}>
            {transaction.referenceId}
          </Typography>
        </div>
      </td>

      <td
        key={`transaction_${index}_2`}
        className="max-w-[150px] items-center border-b border-grey-200 px-2 py-3"
      >
        <Link
          href={createTransactionHashUrl(
            transaction.transactionHash,
            transaction.network,
          )}
          className="grid grid-cols-1fr/auto items-center gap-x-1 text-blue-500"
        >
          <Typography variant={TYPOGRAPHY.R4} className="truncate">
            {transaction.transactionHash}
          </Typography>
          <ExternalLinkIcon />
        </Link>
      </td>

      <td
        key={`transaction_${index}_3`}
        className="items-center border-b border-grey-200 px-2 py-3"
      >
        <Typography variant={TYPOGRAPHY.R4}>
          {formatAddress(transaction.fromWalletAddress)}
        </Typography>
      </td>

      <td
        key={`transaction_${index}_4`}
        className="items-center border-b border-grey-200 px-2 py-3"
      >
        <AddressArrow status={transaction.transactionStatus} />
      </td>

      <td
        key={`transaction_${index}_5`}
        className="items-center border-b border-grey-200 px-2 py-3"
      >
        <Typography variant={TYPOGRAPHY.R4}>
          {formatAddress(transaction.recipientAddress)}
        </Typography>
      </td>

      <td
        key={`transaction_${index}_6`}
        className=" border-b border-grey-200 px-2 py-3 "
      >
        <Typography variant={TYPOGRAPHY.R4} className="whitespace-nowrap">
          {formatDate(transaction.updatedAt)}
        </Typography>
      </td>

      <td
        key={`transaction_${index}_7`}
        className=" border-b border-grey-200 px-2 py-3"
      >
        <TransactionStatusBadge status={transaction.transactionStatus} />
      </td>
    </tr>
  );
};
