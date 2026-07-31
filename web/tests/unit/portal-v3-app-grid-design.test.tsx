/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const openCreateAppDialog = jest.fn();
jest.mock("@/scenes/common/layout/CreateAppDialog/useCreateAppDialog", () => ({
  useCreateAppDialog: () => ({ open: openCreateAppDialog }),
}));

const refetch = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: () => ({
    data: {
      app: [
        {
          id: "app_1",
          is_staging: false,
          engine: "cloud",
          app_metadata: [
            {
              id: "metadata_1",
              name: "Example app",
              logo_img_url: "",
              verification_status: "unverified",
            },
          ],
        },
      ],
    },
    loading: false,
    refetch,
  }),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_1" }),
}));

jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/page/Apps/App/AppLogo", () => ({
  AppLogo: () => <div data-testid="app-logo" />,
}));
jest.mock("@/components/AppStatus", () => ({
  AppStatus: () => <span>Not verified</span>,
}));
// #endregion

import { Apps } from "@/scenes/PortalV3/Teams/TeamId/Team/page/Apps";

beforeEach(() => jest.clearAllMocks());

it("uses the newer action-grid design without environment or engine tags", () => {
  render(<Apps />);

  const createTile = screen.getByRole("button", { name: "Create an app" });
  const grid = createTile.parentElement;
  const appLink = screen.getByRole("link");

  expect(grid).toHaveClass("gap-4", "sm:grid-cols-2", "lg:grid-cols-3");
  expect(createTile).toHaveClass(
    "min-h-[144px]",
    "rounded-[10px]",
    "border-dashed",
  );
  expect(appLink).toHaveClass(
    "min-h-[144px]",
    "rounded-[10px]",
    "border-portal-border",
    "p-5",
  );
  expect(screen.getByText("Example app")).toHaveClass("leading-[1.2]");
  expect(screen.queryByText("Production")).not.toBeInTheDocument();
  expect(screen.queryByText("Cloud")).not.toBeInTheDocument();

  fireEvent.click(createTile);
  expect(openCreateAppDialog).toHaveBeenCalledTimes(1);
});
