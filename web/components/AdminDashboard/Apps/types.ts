import type { AppColumnVisibility } from "./column-visibility";
import type { AppsSort } from "./sorting";

export type AppTableRow = {
  id: string;
  name: string;
  teamId?: string;
  draftMetadataName?: string;
  verifiedMetadataName?: string;
  createdAt?: string;
};

export type AppsTableProps = {
  columnVisibility: AppColumnVisibility;
  data: AppTableRow[];
  sort: AppsSort | null;
};
