"use server";

import { TransactionMetadata } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";

export const getTransactionData = async (
  appId: string,
  transactionId?: string,
): Promise<TransactionMetadata[]> => {
  try {
    if (!process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT) {
      throw new Error("Internal payments endpoint must be set.");
    }

    const signedFetch = createSignedFetcher({
      service: "execute-api",
      region: "us-east-1",
    });

    let url = `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}?miniapp-id=${appId}`;

    if (transactionId) {
      url += `&transaction-id=${transactionId}`;
    }
    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Failed to fetch transaction data. Status: ${response.status}. Error: ${data}`,
      );
    }

    return data?.result?.transactions || [];
  } catch (error) {
    console.warn("Error fetching transaction data", error);
    return [];
  }
};
