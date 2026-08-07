/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import Layout from "../../app/(portal)/profile/layout";

it("renders the profile without the legacy tab layout", async () => {
  render(await Layout({ children: <div data-testid="profile-page" /> }));
  expect(screen.getByTestId("profile-page")).toBeInTheDocument();
});
