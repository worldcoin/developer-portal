/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppModeCards } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/AppModeCards";

describe("Get Verified app type cards", () => {
  it("stretches both cards and makes the full card select its radio", () => {
    const onChange = jest.fn();
    render(<AppModeCards value="mini-app" onChange={onChange} />);

    const miniAppRadio = screen.getByRole("radio", { name: "Mini App" });
    const externalRadio = screen.getByRole("radio", {
      name: "External integration",
    });
    const miniAppCard = miniAppRadio.closest("label");
    const externalCard = externalRadio.closest("label");

    expect(miniAppCard?.parentElement).toHaveClass("items-stretch");
    expect(miniAppCard).toHaveClass("flex-1");
    expect(externalCard).toHaveClass("flex-1");

    fireEvent.click(externalCard!);

    expect(onChange).toHaveBeenCalledWith("external");
  });
});
