export enum AffiliateWithdrawStep {
  ENTER_WALLET_ADDRESS = "ENTER_WALLET_ADDRESS",
  ENTER_AMOUNT = "ENTER_AMOUNT",
  CONFIRM = "CONFIRM",
  ENTER_CODE = "ENTER_CODE",
  SUCCESS = "SUCCESS",
}

export type WithdrawFormData = {
  walletAddress: string;
  amount: number;
  amountInWld: string; // Ready-to-send wei string, set alongside amount
  otpCode: string;
};
