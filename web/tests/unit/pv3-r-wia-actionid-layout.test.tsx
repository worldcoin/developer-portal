/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import Layout from "../../app/(portal)/teams/[teamId]/apps/[appId]/world-id-actions/[actionId]/layout";

it("leaves the self-contained action detail unwrapped", async () => {
  render(
    await Layout({
      params: Promise.resolve({ teamId: "t", appId: "a", actionId: "x" }),
      children: <div data-testid="action-detail" />,
    }),
  );
  expect(screen.getByTestId("action-detail")).toBeInTheDocument();
});
