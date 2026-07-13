import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { PaymentMetadata } from "@/lib/types";
import { ComponentProps } from "react";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";
import { ErrorState } from "./ErrorState";
import { TransactionsTable } from "./TransactionsTable";
import { getTransactionData } from "./server";

type TransactionsPageProps = {
  params: Record<string, string> | null | undefined;
};

const TransactionsPageLayout = ({
  children,
  showHeading = true,
}: {
  children: React.ReactNode;
  showHeading?: boolean;
}) => {
  return (
    <div className="my-6 min-h-[100dvh]">
      {showHeading && (
        <div className="flex items-center justify-start text-gray-900">
          <Typography variant={TYPOGRAPHY.H6}>Transactions</Typography>
        </div>
      )}
      <div className={showHeading ? "pt-12" : ""}>{children}</div>
    </div>
  );
};

const SparkleIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
};

const EmptyState = () => {
  return (
    <div className="grid justify-items-center pt-8">
      <div className="grid justify-items-center gap-y-6">
        <div className="relative size-16 shrink-0 rounded-full bg-grey-400 text-grey-0">
          <span
            className="pointer-events-none absolute inset-0 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(99.88% 100% at 22.73% 0%, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          />
          <span className="pointer-events-none absolute inset-0 rounded-full border border-white/10" />
          <span
            className="absolute"
            style={{
              left: "23.44%",
              right: "23.44%",
              top: "23.44%",
              bottom: "23.44%",
            }}
          >
            <span
              className="absolute"
              style={{
                left: "6%",
                right: "6%",
                top: "6%",
                bottom: "6%",
              }}
            >
              <SparkleIcon className="size-full" />
            </span>
          </span>
        </div>

        <div className="grid justify-items-center gap-y-2">
          <Typography variant={TYPOGRAPHY.H6}>No transactions yet</Typography>
        </div>
        <Typography
          variant={TYPOGRAPHY.R3}
          className="text-center text-grey-500"
        >
          Once you receive your first payment, you
          <br />
          will see the transaction here.
        </Typography>

        <DecoratedButton
          href="https://docs.world.org/mini-apps/commands/pay"
          className="min-w-[112px] py-4"
        >
          See docs
        </DecoratedButton>
      </div>
    </div>
  );
};

const TransactionsContent = ({
  transactionData,
}: {
  transactionData: PaymentMetadata[];
}) => {
  return (
    <Suspense fallback={<Skeleton />}>
      <TransactionsTable transactionData={transactionData} />
    </Suspense>
  );
};

export const TransactionsPage = async (props: TransactionsPageProps) => {
  const { params } = props;
  const appId = params?.appId as `app_${string}`;

  const result = await getTransactionData(appId);

  // Early return for error state
  if (!result.success) {
    return (
      <TransactionsPageLayout>
        <ErrorState />
      </TransactionsPageLayout>
    );
  }

  const transactionData = result.data as PaymentMetadata[];

  // Early return for empty state
  if (transactionData.length === 0) {
    return (
      <TransactionsPageLayout showHeading={false}>
        <EmptyState />
      </TransactionsPageLayout>
    );
  }

  // Success state with data
  return (
    <TransactionsPageLayout>
      <TransactionsContent transactionData={transactionData} />
    </TransactionsPageLayout>
  );
};
