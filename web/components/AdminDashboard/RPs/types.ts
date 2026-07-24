import type { RpColumnVisibility } from "./column-visibility";
import type { RpsSort } from "./sorting";
import type { RpRegistrationStatus } from "@/lib/rp-registration-status";

export type RpRegistrationMode = "managed" | "self_managed";

export type RpStatus = `${RpRegistrationStatus}`;

export type RpTableRow = {
  appId: string;
  appName: string;
  createdAt?: string;
  id: string;
  mode: RpRegistrationMode;
  operationHash?: string | null;
  rpId: string;
  signerAddress?: string | null;
  stagingOperationHash?: string | null;
  stagingStatus?: RpStatus | null;
  status: RpStatus;
  teamId?: string;
  updatedAt?: string;
};

export type RpsTableProps = {
  columnVisibility: RpColumnVisibility;
  data: RpTableRow[];
  sort: RpsSort | null;
};
