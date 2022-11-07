export type CreateActionFormValues = {
  app_id: string;
  name: string;
  description: string;
  environment?: "production" | "staging";
  engine?: "cloud" | "on-chain";
};
