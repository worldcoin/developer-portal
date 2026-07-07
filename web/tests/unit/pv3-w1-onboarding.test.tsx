/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { useAtomValue } from "jotai";
import React from "react";

import { createAppDialogOpenedAtom } from "@/scenes/common/layout/Header/atoms";
import { ClientPage } from "@/scenes/Portal/Teams/TeamId/Apps/page/ClientPage";

// Reads the real jotai atom so the manual-CTA test can assert on it without
// mocking jotai — ClientPage uses the same atom instance via useAtom.
const AtomProbe = () => {
  const open = useAtomValue(createAppDialogOpenedAtom);
  return <div data-testid="atom-probe">{String(open)}</div>;
};

const renderPage = () =>
  render(
    <>
      <ClientPage teamId="team_1" />
      <AtomProbe />
    </>,
  );

it("renders the new title and description", () => {
  renderPage();
  expect(screen.getByText("Verify your first human")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Prove your users are real, unique people — no personal data required. Two ways to integrate World ID:",
    ),
  ).toBeInTheDocument();
});

it("renders both the manual and agents cards", () => {
  renderPage();
  expect(screen.getByText("Build manually")).toBeInTheDocument();
  expect(screen.getByText("Build with agents")).toBeInTheDocument();
  expect(screen.getByText("Create an app")).toBeInTheDocument();
  expect(
    screen.getByText("Create an action & drop in the widget"),
  ).toBeInTheDocument();
});

it("manual CTA click sets the create-app dialog atom to true", () => {
  renderPage();
  expect(screen.getByTestId("atom-probe")).toHaveTextContent("false");
  fireEvent.click(screen.getByTestId("button-create-an-app"));
  expect(screen.getByTestId("atom-probe")).toHaveTextContent("true");
});

it("keeps the agents card's API-key CTA href unchanged", () => {
  renderPage();
  const cta = screen.getByText("Create API key").closest("a");
  expect(cta).toHaveAttribute("href", "/teams/team_1/api-keys");
});

it("renders the updated footer line", () => {
  renderPage();
  expect(
    screen.getByText(
      "Both paths end the same way: a verified human in your dashboard.",
    ),
  ).toBeInTheDocument();
});

it("renders the agents card's retargeted description", () => {
  renderPage();
  expect(
    screen.getByText(
      "Connect Codex, Claude, or any MCP client — your agent creates the app and action, you watch the first proof land.",
    ),
  ).toBeInTheDocument();
});
