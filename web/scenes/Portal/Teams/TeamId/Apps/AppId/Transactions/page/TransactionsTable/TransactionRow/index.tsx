import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { TransactionMetadata } from "@/lib/types";

export const TransactionRow = (props: { transaction: TransactionMetadata }) => {
  const { transaction } = props;
  return (
    <div className="max-md:grid max-md:grid-cols-[1fr_auto] max-md:rounded-20 max-md:border max-md:border-grey-100 max-md:px-5 max-md:py-4 md:contents md:[&>*]:border-b md:[&>*]:border-grey-100 md:[&>*]:py-3">
      <div className="grid items-center text-grey-500 max-md:text-end md:px-2">
        <Typography variant={TYPOGRAPHY.R4}>
          {transaction.inputTokenAmount}
        </Typography>
      </div>
      <div className="grid items-center text-grey-500 max-md:text-end md:px-2">
        <Typography variant={TYPOGRAPHY.R4}>
          {transaction.referenceId}
        </Typography>
      </div>
      <div className="grid items-center text-grey-500 max-md:text-end md:px-2">
        <Typography variant={TYPOGRAPHY.R4}>
          {transaction.transactionHash}
        </Typography>
      </div>
      <div className="grid items-center text-grey-500 max-md:text-end md:px-2">
        <Typography variant={TYPOGRAPHY.R4}>
          {transaction.fromWalletAddress}
        </Typography>
      </div>
      <div className="grid items-center text-grey-500 max-md:text-end md:px-2">
        <Typography variant={TYPOGRAPHY.R4}>
          {transaction.recipientAddress}
        </Typography>
      </div>
      <div className="grid items-center text-grey-500 max-md:text-end md:px-2">
        <Typography variant={TYPOGRAPHY.R4}>{transaction.updatedAt}</Typography>
      </div>
      <div className="grid items-center whitespace-nowrap text-grey-500 max-md:hidden md:pl-2">
        <Typography variant={TYPOGRAPHY.R4}>
          {transaction.transactionStatus}
        </Typography>
      </div>
    </div>
  );
};
