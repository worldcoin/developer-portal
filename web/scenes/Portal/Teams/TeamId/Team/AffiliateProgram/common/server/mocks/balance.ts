import { AffiliateBalanceResponse } from "@/lib/types";

export const affiliateBalanceMock: AffiliateBalanceResponse = {
  availableBalance: "50000000000000000000", // 50 WLD (can withdraw)
  pendingBalance: "4000000000000000000", // 4 WLD (waiting 24h)
  totalEarned: "100000000000000000000", // 100 WLD (lifetime)
  lastAccumulatedAt: "2025-10-06T10:00:00Z",
  minimumWithdrawal: "10000000000000000000", // 10 WLD minimum
  maximumWithdrawal: "100000000000000000000", // 100 WLD maximum
  withdrawalWallet: "0x1234567890123456789012345678901234567890", // Most recent withdrawal wallet address
};
