"use server";

import { errorFormAction } from "@/api/helpers/errors";
import {
  PaymentMetadata,
  TokenPrecision,
  TransactionMetadata,
  TransactionStatus,
} from "@/lib/types";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/utils";
import { createSignedFetcher } from "aws-sigv4-fetch";

export type GetAccumulativePaymentsDataReturnType = Awaited<
  ReturnType<typeof getAccumulativePaymentsData>
>;

export type GetAccumulativeTransactionsDataReturnType = Awaited<
  ReturnType<typeof getAccumulativeTransactionsData>
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

/*
  Helper function to fetch transaction data from the backend.
*/
const fetchTransactionData = async (
  type: "payments" | "transactions",
  appId: string,
  url: string,
) => {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  const signedFetch = createSignedFetcher({
    service: "execute-api",
    region: process.env.TRANSACTION_BACKEND_REGION,
  });

  const response = await signedFetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "DevPortal/1.0",
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();

  if (!response.ok) {
    errorFormAction({
      message: `Failed to fetch ${type} data`,
      additionalInfo: { url, response, data },
      team_id: teamId,
      app_id: appId,
    });
  }

  return data;
};

/*
  This function fetches both payment and transaction data for a given appId
  and returns the accumulative transaction data.
*/
export const getAccumulativePaymentsData = async (
  appId: string,
): Promise<{
  accumulativePayments: PaymentMetadata[];
  accumulatedTokenAmountUSD: number;
}> => {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  try {
    if (!process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT) {
      errorFormAction({
        message:
          "getAccumulativePaymentsData - internal payments endpoint must be set",
        app_id: appId,
        team_id: teamId,
      });
    }

    let fetchPaymentsUrl = `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}/miniapp?miniapp-id=${appId}`;

    // Anchor: Process Payments Data
    const data = await fetchTransactionData(
      "payments",
      appId,
      fetchPaymentsUrl,
    );

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
    errorFormAction({
      message: "getAccumulativePaymentsData - error fetching transaction data",
      error: error as Error,
      app_id: appId,
      team_id: teamId,
    });
  }
};

export const getAccumulativeTransactionsData = async (
  appId: string,
): Promise<{
  accumulativeTransactions: TransactionMetadata[];
  accumulatedTransactionCount: number;
}> => {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  try {
    if (!process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT) {
      errorFormAction({
        message:
          "getAccumulativeTransactionsData - internal transactions endpoint must be set",
        app_id: appId,
        team_id: teamId,
      });
    }

    let fetchTransactionsUrl = `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}/miniapp-actions?miniapp-id=${appId}`;

    const transactionsData = await fetchTransactionData(
      "transactions",
      appId,
      fetchTransactionsUrl,
    );

    const sortedTransactions = (
      transactionsData?.result?.transactions || []
    ).sort(
      (a: TransactionMetadata, b: TransactionMetadata) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ) as TransactionMetadata[];

    // We only count successful transactions
    const accumulatedTransactionCount = sortedTransactions.reduce(
      (acc, transaction) => {
        if (transaction.transactionStatus !== TransactionStatus.Mined) {
          return acc;
        }

        return acc + 1;
      },
      0,
    );

    return {
      accumulativeTransactions: sortedTransactions,
      accumulatedTransactionCount,
    };
  } catch (error) {
    errorFormAction({
      message:
        "getAccumulativeTransactionsData - error fetching transaction data",
      error: error as Error,
      app_id: appId,
      team_id: teamId,
    });
  }
};
