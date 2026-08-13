/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { AvailableCountries } from "@/scenes/Admin/apps/id/AvailableCountries";

describe("admin app available countries", () => {
  it("shows country names as a comma-delimited list", () => {
    render(<AvailableCountries countryCodes={["us", "GB", "DE"]} />);

    expect(
      screen.getByText("United States, United Kingdom, Germany"),
    ).toBeVisible();
    expect(screen.getByText("Available countries:")).toBeVisible();
    expect(screen.queryByText("US")).toBeNull();
  });

  it("shows an empty state when no countries are selected", () => {
    render(<AvailableCountries countryCodes={[]} />);

    expect(screen.getByText("No countries selected.")).toBeVisible();
  });
});
