"use server";

import { TransactionMetadata } from "@/lib/types";

export const getTransactionData = async (
  appId: string,
  transactionId?: string,
): Promise<TransactionMetadata[]> => {
  const response = await fetch(
    `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}?transactionId=${transactionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ miniappId: appId }),
    },
  );

  const data = await response.json();
  return data;
};
