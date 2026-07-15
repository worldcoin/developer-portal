import type { ReactNode } from "react";

type MobileAdminListProps<RowData extends { id: string }> = {
  data: RowData[];
  renderCard: (row: RowData) => ReactNode;
};

export const MobileAdminList = <RowData extends { id: string }>({
  data,
  renderCard,
}: MobileAdminListProps<RowData>) => (
  <div className="grid gap-3 lg:hidden">{data.map(renderCard)}</div>
);
