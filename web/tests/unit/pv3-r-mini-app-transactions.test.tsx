/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page",
  () => ({
    TransactionsPage: () => <div data-testid="v2-mini-app-transactions" />,
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page",
  () => ({
    TransactionsPage: () => <div data-testid="v3-mini-app-transactions" />,
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/mini-app/transactions/page";
it("renders v3 mini-app-transactions", async () => {
  render(
    await RoutePage({ params: Promise.resolve({ teamId: "t", appId: "a" }) }),
  );
  expect(screen.getByTestId("v3-mini-app-transactions")).toBeInTheDocument();
  expect(
    screen.queryByTestId("v2-mini-app-transactions"),
  ).not.toBeInTheDocument();
});
