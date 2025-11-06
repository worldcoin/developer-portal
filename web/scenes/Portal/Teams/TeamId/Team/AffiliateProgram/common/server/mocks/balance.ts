import { AffiliateBalanceResponse } from "@/lib/types";

export const affiliateBalanceMock: AffiliateBalanceResponse = {
  result: {
    availableBalance: {
      inWLD: "50000000000000000000", // 50 WLD (can withdraw)
      inCurrency: 50.0, // 50 USD
    },
    pendingBalance: {
      inWLD: "4000000000000000000", // 4 WLD (waiting 24h)
      inCurrency: 4.0, // 4 USD
    },
    lastAccumulatedAt: "2025-10-06T10:00:00Z",
    minimumWithdrawal: "10000000000000000000", // 10 WLD minimum
    maximumWithdrawal: "100000000000000000000", // 100 WLD maximum
    withdrawalWallet: "0x1234567890123456789012345678901234567890", // Most recent withdrawal wallet address
  },
};
