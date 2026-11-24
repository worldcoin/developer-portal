/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("@/components/AdminDashboard/common/DesktopAdminTable", () => ({
  DesktopAdminTable: () => null,
}));

import { AppsTable } from "@/components/AdminDashboard/Apps/Table";
import { DEFAULT_APP_COLUMN_VISIBILITY } from "@/components/AdminDashboard/Apps/column-visibility";

const data = [
  {
    createdAt: "2026-07-15",
    draftMetadataName: "Draft",
    id: "app_1",
    name: "Example app",
    teamId: "team_1",
    verifiedMetadataName: "Verified",
  },
];

describe("admin apps mobile table", () => {
  it("renders the enabled creation date", () => {
    render(
      <AppsTable
        columnVisibility={DEFAULT_APP_COLUMN_VISIBILITY}
        data={data}
        sort={null}
      />,
    );

    expect(screen.getByText("Created")).toBeVisible();
    expect(screen.getByText("2026-07-15")).toBeVisible();
  });

  it("hides the creation date when the column is hidden", () => {
    render(
      <AppsTable
        columnVisibility={{
          ...DEFAULT_APP_COLUMN_VISIBILITY,
          createdAt: false,
        }}
        data={data}
        sort={null}
      />,
    );

    expect(screen.queryByText("Created")).toBeNull();
    expect(screen.queryByText("2026-07-15")).toBeNull();
  });
});
