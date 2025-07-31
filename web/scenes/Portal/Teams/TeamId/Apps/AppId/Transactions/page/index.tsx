import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { PaymentMetadata } from "@/lib/types";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { TransactionsTable } from "./TransactionsTable";
import { getTransactionData } from "./server";

type TransactionsPageProps = {
  params: Record<string, string> | null | undefined;
};

export const TransactionsPage = async (props: TransactionsPageProps) => {
  const { params } = props;
  const appId = params?.appId as `app_${string}`;

  const result = await getTransactionData(appId);
  let transactionData: PaymentMetadata[] = [];
  if (!result.success) {
    toast.error(result.message);
  } else {
    transactionData = result.data as PaymentMetadata[];
  }

  return (
    <div className="my-6 min-h-[100dvh]">
      <div className="flex items-center justify-start gap-x-2 text-gray-900">
        <Typography variant={TYPOGRAPHY.H6}>Payments</Typography>
      </div>
      <hr className="mt-5 w-full border-dashed text-grey-200" />

      {transactionData.length === 0 ? (
        <div className="grid grid-cols-1 justify-items-center gap-y-8 pt-12">
          <div className="grid justify-items-center gap-y-5 ">
            <Typography variant={TYPOGRAPHY.H6}>No payments yet</Typography>

            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-center text-grey-500"
            >
              Set up mini app payments. Once you receive your first payment, you{" "}
              <br></br>
              will see the transaction here.
            </Typography>
          </div>
          {/* // TODO: Change to mini app docs */}
          <DecoratedButton
            href="https://docs.world.org/world-id"
            className="py-4"
          >
            See Docs
          </DecoratedButton>
        </div>
      ) : (
        <Suspense fallback={<Skeleton />}>
          <TransactionsTable transactionData={transactionData} />
        </Suspense>
      )}
    </div>
  );
};
