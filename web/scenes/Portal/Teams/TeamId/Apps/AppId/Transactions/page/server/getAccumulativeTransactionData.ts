"use server";

import { logger } from "@/lib/logger";
import { PaymentMetadata } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";

export type GetAccumulativeTransactionDataReturnType = Awaited<
  ReturnType<typeof getAccumulativeTransactionData>
>;

export const getAccumulativeTransactionData = async (
  appId: string,
): Promise<{
  accumulativeTransactions: PaymentMetadata[];
  accumulatedAmount: number;
  accumulatedTokens: number;
}> => {
  try {
    if (!process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT) {
      throw new Error("Internal payments endpoint must be set.");
    }

    const signedFetch = createSignedFetcher({
      service: "execute-api",
      region: process.env.TRANSACTION_BACKEND_REGION,
    });

    let url = `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}/miniapp?miniapp-id=${appId}`;

    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Failed to fetch transaction data. Status: ${response.status}. Error: ${data}`,
      );
    }
    const sortedTransactions = (data?.result?.transactions || []).sort(
      (a: PaymentMetadata, b: PaymentMetadata) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ) as PaymentMetadata[];

    let accumulatedAmount = 0;
    let accumulatedTokens = 0;
    const accumulativeTransactions = sortedTransactions.map((transaction) => {
      accumulatedAmount += Number(transaction.inputTokenAmount);
      accumulatedTokens += Number(transaction.inputToken);
      return { ...transaction, inputTokenAmount: String(accumulatedAmount) };
    });

    return { accumulativeTransactions, accumulatedAmount, accumulatedTokens };
  } catch (error) {
    logger.warn("Error fetching transaction data", { error });
    return {
      accumulativeTransactions: [],
      accumulatedAmount: 0,
      accumulatedTokens: 0,
    };
  }
};
