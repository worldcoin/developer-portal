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

import { RpsTable } from "@/components/AdminDashboard/RPs/Table";
import { DEFAULT_RP_COLUMN_VISIBILITY } from "@/components/AdminDashboard/RPs/column-visibility";

const data = [
  {
    appId: "app_1",
    appName: "Example app",
    createdAt: "2026-07-15",
    id: "rp_0123456789abcdef",
    mode: "managed" as const,
    operationHash:
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    rpId: "rp_0123456789abcdef",
    signerAddress: "0x0000000000000000000000000000000000000090",
    stagingOperationHash:
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb90",
    status: "registered" as const,
    stagingStatus: "pending" as const,
    teamId: "team_1",
    updatedAt: "2026-07-16",
  },
];

describe("admin RPs mobile table", () => {
  it("renders the enabled creation date", () => {
    render(
      <RpsTable
        columnVisibility={DEFAULT_RP_COLUMN_VISIBILITY}
        data={data}
        sort={null}
      />,
    );

    expect(screen.getByText("Created")).toBeVisible();
    expect(screen.getByText("2026-07-15")).toBeVisible();
  });

  it("hides the creation date when the column is hidden", () => {
    render(
      <RpsTable
        columnVisibility={{
          ...DEFAULT_RP_COLUMN_VISIBILITY,
          createdAt: false,
        }}
        data={data}
        sort={null}
      />,
    );

    expect(screen.queryByText("Created")).toBeNull();
    expect(screen.queryByText("2026-07-15")).toBeNull();
  });

  it("renders enabled signer and operation hash fields", () => {
    render(
      <RpsTable
        columnVisibility={DEFAULT_RP_COLUMN_VISIBILITY}
        data={data}
        sort={null}
      />,
    );

    expect(screen.getByText("Signer")).toBeVisible();
    expect(
      screen.getByText("0x0000000000000000000000000000000000000090"),
    ).toBeVisible();
    expect(screen.getByText("Operation hash")).toBeVisible();
    expect(
      screen.getByText(
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      ),
    ).toBeVisible();
    expect(screen.getByText("Staging operation hash")).toBeVisible();
    expect(
      screen.getByText(
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb90",
      ),
    ).toBeVisible();
  });

  it("hides signer and operation hash fields when columns are hidden", () => {
    render(
      <RpsTable
        columnVisibility={{
          ...DEFAULT_RP_COLUMN_VISIBILITY,
          operationHash: false,
          signerAddress: false,
          stagingOperationHash: false,
        }}
        data={data}
        sort={null}
      />,
    );

    expect(screen.queryByText("Signer")).toBeNull();
    expect(screen.queryByText("Operation hash")).toBeNull();
    expect(screen.queryByText("Staging operation hash")).toBeNull();
  });
});
