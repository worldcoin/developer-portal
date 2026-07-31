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

it("shows the vertical RP identity fields and management controls", () => {
  renderSummary();

  const summary = screen.getByRole("region", {
    name: "World ID configuration",
  });
  expect(summary).toHaveClass("flex", "max-w-[580px]", "flex-col");
  expect(summary).not.toHaveClass("rounded-xl", "border", "bg-white");

  expect(screen.getByText("app_1")).toBeInTheDocument();
  expect(screen.getByText("rp_1234567890abcdef")).toBeInTheDocument();
  expect(
    screen.getByText("0x1234567890abcdef1234567890abcdef12345678"),
  ).toBeInTheDocument();
  expect(screen.queryByText("Management mode")).toBeNull();
  expect(screen.getByRole("button", { name: "Copy App ID" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Copy RP ID" })).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Copy Signer address" }),
  ).toBeEnabled();
  const copyButtons = [
    screen.getByRole("button", { name: "Copy App ID" }),
    screen.getByRole("button", { name: "Copy RP ID" }),
    screen.getByRole("button", { name: "Copy Signer address" }),
  ];
  for (const copyButton of copyButtons) {
    expect(copyButton).toHaveClass("ml-auto", "shrink-0");
  }
  const rotateButton = screen.getByRole("button", {
    name: "Rotate signer key",
  });
  const switchButton = screen.getByRole("button", {
    name: "Switch to self-managed",
  });
  expect(rotateButton).toBeEnabled();
  expect(switchButton).toBeEnabled();
  expect(rotateButton.parentElement).toBe(switchButton.parentElement);
  expect(rotateButton.parentElement).toHaveClass("flex", "flex-wrap");
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
