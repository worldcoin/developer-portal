"use server";

import { logger } from "@/lib/logger";
import {
  PaymentMetadata,
  TokenPrecision,
  TransactionStatus,
} from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";

export type GetAccumulativeTransactionDataReturnType = Awaited<
  ReturnType<typeof getAccumulativeTransactionData>
>;

const calculateUSDAmount = (
  tokenAmount: number,
  tokenPrecision: TokenPrecision,
  tokenPrice: number,
  tokenPricePrecision: number,
) => (tokenAmount * tokenPrice) / 10 ** (tokenPrecision + tokenPricePrecision);

// account for erc20 token precision
const safelyAdd = (a: number, b: number) =>
  (a * 10 ** 18 + b * 10 ** 18) / 10 ** 18;

const roundToTwoDecimals = (num: number) => Math.round(num * 100) / 100;

// This hook fetches both payment and transaction data for a given appId
export const getAccumulativeTransactionData = async (
  appId: string,
): Promise<{
  accumulativePayments: PaymentMetadata[];
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
        `https://app-backend.worldcoin.dev/public/v1/miniapps/prices?cryptoCurrencies=WLD,USDCE&fiatCurrencies=USD`,
      )
    ).json()) as {
      result: {
        prices: {
          WLD: { USD: { amount: string; decimals: number } };
          USDCE: { USD: { amount: string; decimals: number } };
        };
      };
    };

    const { accumulativePayments, accumulatedTokenAmountUSD } =
      sortedTransactions.reduce(
        (acc, transaction) => {
          if (transaction.transactionStatus !== TransactionStatus.Mined) {
            return acc;
          }

          if (transaction.inputToken === "WLD") {
            acc.accumulatedTokenAmountWLD += Number(
              transaction.inputTokenAmount,
            );
          } else if (transaction.inputToken === "USDCE") {
            acc.accumulatedTokenAmountUSDCE += Number(
              transaction.inputTokenAmount,
            );
          }

          acc.accumulatedTokenAmountUSD = safelyAdd(
            calculateUSDAmount(
              acc.accumulatedTokenAmountWLD,
              TokenPrecision.WLD,
              Number(tokenPriceResponse.result.prices.WLD.USD.amount),
              tokenPriceResponse.result.prices.WLD.USD.decimals,
            ),
            calculateUSDAmount(
              acc.accumulatedTokenAmountUSDCE,
              TokenPrecision.USDCE,
              Number(tokenPriceResponse.result.prices.USDCE.USD.amount),
              tokenPriceResponse.result.prices.USDCE.USD.decimals,
            ),
          );

          acc.accumulativePayments.push({
            ...transaction,
            inputTokenAmount: String(acc.accumulatedTokenAmountUSD),
          });

          return acc;
        },
        {
          accumulatedTokenAmountWLD: 0,
          accumulatedTokenAmountUSDCE: 0,
          accumulatedTokenAmountUSD: 0,
          accumulativePayments: [] as PaymentMetadata[],
        },
      );

    return {
      accumulativePayments,
      accumulatedTokenAmountUSD: roundToTwoDecimals(accumulatedTokenAmountUSD),
    };
  } catch (error) {
    logger.warn("Error fetching transaction data", {
      error: JSON.stringify(error),
    });

    return {
      accumulativePayments: [],
      accumulatedTokenAmountUSD: 0,
    };
  }
};
