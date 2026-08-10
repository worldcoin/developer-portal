export type AdminLegacyActionUsage = {
  action: string;
  createdAt: string;
  id: string;
  name: string;
  status: string;
  totalUses: number;
  uniqueNullifiers: number;
};

export type AdminWorldId40ActionUsage = {
  action: string;
  createdAt: string;
  environment: string;
  id: string;
  recordedUniqueUses: number;
  rpId: string;
};
