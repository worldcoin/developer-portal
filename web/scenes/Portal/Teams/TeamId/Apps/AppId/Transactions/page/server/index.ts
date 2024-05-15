"use server";

import { TransactionMetadata } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";

export const getTransactionData = async (
  appId: string,
  transactionId?: string,
): Promise<TransactionMetadata[]> => {
  try {
    const signedFetch = createSignedFetcher({
      service: "execute-api",
      region: "eu-west-1",
    });

    let url = `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}?miniapp-id=${appId}`;
    if (transactionId) {
      url += `&transaction-id=${transactionId}`;
    }
    const response = await signedFetch(url, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Failed to fetch transaction data. Status: ${response.status}. Error: ${data}`,
      );
    }

    console.log(data); // Keep for now since we can only test on staging
    return data;
  } catch (error) {
    console.warn("Error fetching transaction data", error);
    return [];
  }
};
