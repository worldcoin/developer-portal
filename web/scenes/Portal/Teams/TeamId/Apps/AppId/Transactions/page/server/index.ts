"use server";

import { TransactionMetadata } from "@/lib/types";

export const getTransactionData = async (
  appId: string,
  transactionId?: string,
): Promise<TransactionMetadata[]> => {
  try {
    let url = `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}?miniapp-id=${appId}`;
    if (transactionId) {
      url += `&transaction-id=${transactionId}`;
    }
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch transaction data. Status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log(data); // Keep for now since we can only test on staging
    return data;
  } catch (error) {
    console.warn("Error fetching transaction data", error);
    return [];
  }
};
