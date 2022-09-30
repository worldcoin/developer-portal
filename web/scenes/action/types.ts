import { IconType } from "common/Icon";

export type CreateActionFormValues = {
  app_id: string;
  name: string;
  description: string;
  environment?: "production" | "staging";
  engine?: "cloud" | "on-chain";
};

export type EnvironmentType = {
  name: string;
  value: "production" | "staging";
  icon: { name: IconType; noMask?: boolean };
};
