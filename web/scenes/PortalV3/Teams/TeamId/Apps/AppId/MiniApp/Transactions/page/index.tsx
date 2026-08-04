import { DecoratedButton } from "@/components/DecoratedButton";
import { PaymentMetadata } from "@/lib/types";
import { getTransactionData } from "@/scenes/common/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page/server/getTransactionData";
import { ComponentProps } from "react";
import { Suspense } from "react";
import { SkeletonTable } from "@/components/Skeletons";
import { ErrorState } from "./ErrorState";
import { TransactionsTable } from "./TransactionsTable";
import { MiniAppMessageState } from "../../common/MiniAppMessageState";
import { MiniAppPage, MiniAppPageHeader } from "../../common/MiniAppPage";
import { miniAppButtonClassName } from "../../common/styles";

type TransactionsPageProps = {
  params: Record<string, string> | null | undefined;
};

// The heading is unconditional: it used to be hidden on the empty state, so the
// page lost its title exactly for developers who have taken no payments yet.
const TransactionsPageLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <MiniAppPage>
    <MiniAppPageHeader
      title="Transactions"
      description="Payments your Mini App has received."
    />

    {children}
  </MiniAppPage>
);

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

const EmptyState = () => (
  <MiniAppMessageState
    variant="neutral"
    icon={<SparkleIcon className="size-7 text-white" />}
    title="No transactions yet"
    description="Once you receive your first payment, you will see the transaction here."
    action={
      <DecoratedButton
        href="https://docs.world.org/mini-apps/commands/pay"
        className={miniAppButtonClassName}
      >
        See docs
      </DecoratedButton>
    }
  />
);

const TransactionsContent = ({
  transactionData,
}: {
  transactionData: PaymentMetadata[];
}) => {
  return (
    <Suspense
      fallback={
        <SkeletonTable
          className="py-5"
          rows={5}
          columns={[
            "Amount",
            "Reference Id",
            "Transaction Hash",
            "From",
            "To",
            "Timestamp",
            "Status",
          ]}
        />
      }
    >
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
      <TransactionsPageLayout>
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
