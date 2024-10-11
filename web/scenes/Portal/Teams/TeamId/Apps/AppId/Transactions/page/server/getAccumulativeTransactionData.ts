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
  accumulatedAmountUSD: number;
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

    let accumulatedTokenAmount = 0;
    const accumulativeTransactions = sortedTransactions.map((transaction) => {
      // TODO - floating point issues here? test on real data
      accumulatedTokenAmount += Number(transaction.inputTokenAmount);

      return {
        ...transaction,
        inputTokenAmount: String(accumulatedTokenAmount),
      };
    });

    const tokenPriceResponse = (await (
      await fetch(
        `${process.env.NEXT_PUBLIC_PRICES_ENDPOINT}?cryptoCurrencies=WLD&fiatCurrencies=USD`,
      )
    ).json()) as {
      result: {
        prices: { WLD: { USD: { amount: string; decimals: number } } };
      };
    };

    const accumulatedAmountUSD =
      (accumulatedTokenAmount *
        Number(tokenPriceResponse.result.prices.WLD.USD.amount)) /
      10 ** tokenPriceResponse.result.prices.WLD.USD.decimals;

    return {
      accumulativeTransactions,
      accumulatedAmountUSD,
    };
  } catch (error) {
    logger.warn("Error fetching transaction data", { error });
    return {
      accumulativeTransactions: [],
      accumulatedAmountUSD: 0,
    };
  }
};
