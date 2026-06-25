/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { useAtomValue } from "jotai";
import { PortalV3Provider } from "@/lib/feature-flags/portal-v3/PortalV3Provider";
import { portalV3Atom } from "@/lib/feature-flags/portal-v3/client";

const Probe = () => {
  const config = useAtomValue(portalV3Atom);
  return (
    <span data-testid="probe">
      {String(config.isFetched)}:{config.enabledTeams.join(",")}
    </span>
  );
};

describe("PortalV3Provider", () => {
  it("publishes enabledTeams and isFetched=true on mount", () => {
    render(
      <PortalV3Provider enabledTeams={["team_123"]}>
        <Probe />
      </PortalV3Provider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("true:team_123");
  });
});
