/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { generateRpIdString } from "@/lib/rp";
import { RegisterRpEmptyState } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/RegisterRpEmptyState";

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default:
    () =>
    (props: {
      open: boolean;
      onClose?: (value: boolean) => void;
      onComplete?: () => Promise<void> | void;
    }) =>
      props.open ? (
        <div role="dialog">
          Configure signer key
          <button
            type="button"
            onClick={async () => {
              await props.onComplete?.();
              props.onClose?.(false);
            }}
          >
            Complete registration
          </button>
          <button type="button" onClick={() => props.onClose?.(false)}>
            Cancel registration
          </button>
        </div>
      ) : null,
}));

const defaultProps = {
  appId: "app_9cdd0a714aec9ed17dca660bc9ffe72a",
  isStaging: false,
  canManageWorldId: true,
  onRegistered: jest.fn(),
  onSetupClosed: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

it("shows the finalized configuration shape before registration", () => {
  render(<RegisterRpEmptyState {...defaultProps} />);

  expect(
    screen.getByRole("region", { name: "World ID configuration" }),
  ).toBeInTheDocument();
  expect(screen.getByText(defaultProps.appId)).toBeInTheDocument();
  // The RP ID is assigned at registration, so the label renders but the value
  // is a placeholder — publishing it in advance is what let the on-chain id be
  // claimed before the app got there (H1 #3910854).
  expect(screen.getByText("RP ID")).toBeInTheDocument();
  expect(screen.getByText("—")).toBeInTheDocument();
  expect(
    screen.queryByText(generateRpIdString(defaultProps.appId)),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Signer address")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Register relying party" }),
  ).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Rotate signer key" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Switch to self-managed" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/Enable World ID/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("opens managed signer setup directly from the signer-address slot", () => {
  render(<RegisterRpEmptyState {...defaultProps} />);

  fireEvent.click(
    screen.getByRole("button", { name: "Register relying party" }),
  );

  expect(screen.getByRole("dialog")).toHaveTextContent("Configure signer key");
});

it("refreshes the overview before closing a completed registration", async () => {
  render(<RegisterRpEmptyState {...defaultProps} />);

  fireEvent.click(
    screen.getByRole("button", { name: "Register relying party" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Complete registration" }),
  );

  expect(defaultProps.onRegistered).toHaveBeenCalledTimes(1);
  await waitFor(() =>
    expect(defaultProps.onSetupClosed).toHaveBeenCalledWith(true),
  );
});

it("does not report a registration when the dialog is cancelled", () => {
  render(<RegisterRpEmptyState {...defaultProps} />);

  fireEvent.click(
    screen.getByRole("button", { name: "Register relying party" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel registration" }));

  expect(defaultProps.onSetupClosed).toHaveBeenCalledWith(false);
  expect(defaultProps.onRegistered).not.toHaveBeenCalled();
});

it.each([
  [{ isStaging: true }, "RP registration is not available for staging apps."],
  [
    { canManageWorldId: false },
    "Ask a team owner or admin to register this relying party.",
  ],
])(
  "keeps the summary visible when registration is unavailable",
  (overrides, reason) => {
    render(<RegisterRpEmptyState {...defaultProps} {...overrides} />);

    expect(screen.getByText(defaultProps.appId)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Register relying party" }),
    ).toBeDisabled();
    expect(screen.getByText(reason)).toBeInTheDocument();
  },
);
