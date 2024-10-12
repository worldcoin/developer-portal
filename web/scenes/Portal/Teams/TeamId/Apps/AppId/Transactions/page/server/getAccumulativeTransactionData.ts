"use server";

import { logger } from "@/lib/logger";
import { PaymentMetadata } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";

export type GetAccumulativeTransactionDataReturnType = Awaited<
  ReturnType<typeof getAccumulativeTransactionData>
>;

const calculateUSDAmount = (
  tokenAmount: number,
  tokenPrice: number,
  tokenDecimals: number,
) => {
  return (tokenAmount * tokenPrice) / 10 ** tokenDecimals;
};

export const getAccumulativeTransactionData = async (
  appId: string,
): Promise<{
  accumulativeTransactions: PaymentMetadata[];
  accumulatedTokenAmountUSD: number;
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

    // NOTE fetch all tokens, we need to know them before we can calculate the accumulated amount
    const tokenPriceResponse = (await (
      await fetch(
        `${process.env.NEXT_PUBLIC_PRICES_ENDPOINT}?cryptoCurrencies=WLD,USDCE&fiatCurrencies=USD`,
      )
    ).json()) as {
      result: {
        prices: {
          WLD?: { USD: { amount: string; decimals: number } };
          USDCE?: { USD: { amount: string; decimals: number } };
        };
      };
    };

    let accumulatedTokenAmountWLD = 0;
    let accumulatedTokenAmountUSDCE = 0;
    let accumulatedTokenAmountUSD = 0;
    const cryptoCurrencies = new Set<"WLD" | "USDCE">();
    const accumulativeTransactions = sortedTransactions.map((transaction) => {
      cryptoCurrencies.add(transaction.inputToken as "WLD" | "USDCE");
      // TODO - floating point issues here? test on real data

      if (transaction.inputToken === "WLD") {
        accumulatedTokenAmountWLD += Number(transaction.inputTokenAmount);

        accumulatedTokenAmountUSD += calculateUSDAmount(
          accumulatedTokenAmountWLD,
          Number(tokenPriceResponse!.result.prices.WLD!.USD.amount),
          tokenPriceResponse!.result.prices.WLD!.USD.decimals,
        );
      } else if (transaction.inputToken === "USDCE") {
        accumulatedTokenAmountUSDCE += Number(transaction.inputTokenAmount);

        accumulatedTokenAmountUSD += calculateUSDAmount(
          accumulatedTokenAmountUSDCE,
          Number(tokenPriceResponse!.result.prices.USDCE!.USD.amount),
          tokenPriceResponse!.result.prices.USDCE!.USD.decimals,
        );
      }

      return {
        ...transaction,
        inputTokenAmount: String(accumulatedTokenAmountUSD),
      };
    });

    return {
      accumulativeTransactions,
      accumulatedTokenAmountUSD,
    };
  } catch (error) {
    logger.warn("Error fetching transaction data", { error });
    return {
      accumulativeTransactions: [],
      accumulatedTokenAmountUSD: 0,
    };
  }
};
