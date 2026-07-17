/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import { WorldId40Pane } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/WorldId40Pane";
import { render, screen } from "@testing-library/react";

let mockProductionStatus = RpRegistrationStatus.Registered;
let mockStagingStatus: RpRegistrationStatus | null = null;

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/use-rp-registration-controller",
  () => ({
    useRpRegistrationController: () => ({
      productionStatus: mockProductionStatus,
      stagingStatus: mockStagingStatus,
      retryingEnvironment: null,
      retryRegistration: jest.fn(),
      markProductionPending: jest.fn(),
    }),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/WorldId40Settings",
  () => ({ WorldId40Settings: () => <div data-testid="world-id-settings" /> }),
);

const renderPane = () =>
  render(
    <WorldId40Pane
      appId="app_1"
      rpId="rp_1234567890abcdef"
      initialStatus={mockProductionStatus}
      initialStagingStatus={mockStagingStatus}
      mode="managed"
      createdAt="2026-01-02T12:00:00.000Z"
      canManageWorldId
    />,
  );

beforeEach(() => {
  mockProductionStatus = RpRegistrationStatus.Registered;
  mockStagingStatus = null;
});

it("shows settings only for a registered RP", () => {
  mockStagingStatus = RpRegistrationStatus.Failed;
  renderPane();

  expect(screen.getByText(/Registered/)).toBeInTheDocument();
  expect(screen.getByTestId("world-id-settings")).toBeInTheDocument();
  expect(screen.getByText("Staging registration failed")).toBeInTheDocument();
});

it.each([
  [RpRegistrationStatus.Pending, "Registration in progress"],
  [RpRegistrationStatus.Failed, "Production registration failed"],
  [RpRegistrationStatus.Deactivated, "Registration deactivated"],
])("shows the %s state without settings", (status, message) => {
  mockProductionStatus = status;
  renderPane();

  expect(screen.getByText(message)).toBeInTheDocument();
  expect(screen.queryByTestId("world-id-settings")).not.toBeInTheDocument();
  expect(screen.queryByText(/Registered /)).not.toBeInTheDocument();
});
