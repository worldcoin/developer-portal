/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import { RpSummary } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/RpSummary";

let mockProductionStatus = RpRegistrationStatus.Registered;
let mockStagingStatus: RpRegistrationStatus | null = null;
const retryRegistration = jest.fn();
const markProductionPending = jest.fn();

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/use-rp-registration-controller",
  () => ({
    useRpRegistrationController: () => ({
      productionStatus: mockProductionStatus,
      stagingStatus: mockStagingStatus,
      retryingEnvironment: null,
      retryRegistration,
      markProductionPending,
    }),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/RotateSignerKeyDialog",
  () => ({
    RotateSignerKeyDialog: (props: {
      open: boolean;
      onSuccess?: () => void;
    }) =>
      props.open ? (
        <button type="button" onClick={props.onSuccess}>
          Complete signer rotation
        </button>
      ) : null,
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page/SwitchToSelfManagedDialog",
  () => ({
    SwitchToSelfManagedDialog: (props: {
      open: boolean;
      onSuccess?: () => void;
    }) =>
      props.open ? (
        <button type="button" onClick={props.onSuccess}>
          Complete mode switch
        </button>
      ) : null,
  }),
);

const defaultProps = {
  appId: "app_1",
  rpId: "rp_1234567890abcdef",
  signerAddress: "0x1234567890abcdef1234567890abcdef12345678",
  initialStatus: RpRegistrationStatus.Registered,
  initialStagingStatus: null,
  mode: "managed",
  createdAt: "2026-01-02T12:00:00.000Z",
  canManageWorldId: true,
};

const renderSummary = (
  overrides: Partial<React.ComponentProps<typeof RpSummary>> = {},
) => render(<RpSummary {...defaultProps} {...overrides} />);

beforeEach(() => {
  jest.clearAllMocks();
  mockProductionStatus = RpRegistrationStatus.Registered;
  mockStagingStatus = null;
});

it("shows the compact RP summary and management controls", () => {
  renderSummary();

  expect(screen.getByText("app_1")).toBeInTheDocument();
  expect(screen.getByText("rp_1234567890abcdef")).toBeInTheDocument();
  expect(
    screen.getByText("0x1234567890abcdef1234567890abcdef12345678"),
  ).toBeInTheDocument();
  expect(screen.getByText("Managed")).toBeInTheDocument();
  expect(screen.getByText("Created Jan 2, 2026")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Copy App ID" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Copy RP ID" })).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Copy Signer address" }),
  ).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Rotate signer key" }),
  ).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Switch to self-managed" }),
  ).toBeEnabled();
});

it.each([
  [RpRegistrationStatus.Pending, "Configuration update pending"],
  [RpRegistrationStatus.Failed, "Production registration failed"],
  [RpRegistrationStatus.Deactivated, "Registration deactivated"],
])("keeps the RP identity visible in the %s state", (status, message) => {
  mockProductionStatus = status;
  renderSummary();

  expect(screen.getByText(message)).toBeInTheDocument();
  expect(screen.getByText("rp_1234567890abcdef")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Rotate signer key" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Switch to self-managed" }),
  ).toBeDisabled();
});

it("explains self-managed signer ownership and disables Portal controls", () => {
  renderSummary({ mode: "self_managed" });

  expect(screen.getByText("Self-managed")).toBeInTheDocument();
  expect(screen.getByText("Unavailable in Portal")).toBeInTheDocument();
  expect(
    screen.getByText("Signer keys are managed outside the Portal."),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("0x1234567890abcdef1234567890abcdef12345678"),
  ).toBeNull();
  expect(
    screen.getByRole("button", { name: "Rotate signer key" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Switch to self-managed" }),
  ).toBeDisabled();
});

it("refetches the visible RP data after signer rotation", () => {
  const onRpChanged = jest.fn();
  renderSummary({ onRpChanged });

  fireEvent.click(screen.getByRole("button", { name: "Rotate signer key" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Complete signer rotation" }),
  );

  expect(markProductionPending).toHaveBeenCalledTimes(1);
  expect(onRpChanged).toHaveBeenCalledWith(RpRegistrationStatus.Pending);
});
