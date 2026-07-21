/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import React, { Suspense } from "react";

let mockKeyStepReady = false;
let mockPendingKeyStep: Promise<void>;
let mockResolvePendingKeyStep: () => void;

function mockGenerateKeyStep() {
  if (!mockKeyStepReady) {
    throw mockPendingKeyStep;
  }

  return <div data-testid="generate-key-step">Generate key step loaded</div>;
}

function mockExistingKeyStep() {
  if (!mockKeyStepReady) {
    throw mockPendingKeyStep;
  }

  return <div data-testid="existing-key-step">Existing key step loaded</div>;
}

// Exercise the installed App Router implementation, not a test reimplementation
// of its local Suspense-boundary behavior.
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: jest.requireActual("next/dist/shared/lib/app-dynamic").default,
}));

jest.mock("@apollo/client/react", () => ({
  useMutation: () => [jest.fn(), { loading: false }],
}));
jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_1" }),
  useRouter: () => ({ refresh: jest.fn(), replace: jest.fn() }),
}));
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { capture: jest.fn() },
}));
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));
jest.mock("@/lib/errors", () => ({ getGraphQLErrorCode: jest.fn() }));
jest.mock("@/lib/use-refetch-queries", () => ({
  useRefetchQueries: () => ({ refetch: jest.fn() }),
}));
jest.mock("@/scenes/common/layout/CreateAppDialog/server/v4/submit", () => ({
  validateAndInsertAppServerSideV4: jest.fn(),
}));

jest.mock("@/components/Dialog", () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div role="dialog">{children}</div> : null,
}));
jest.mock("@/components/DialogPanel", () => ({
  DialogPanel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock("@/components/LoggedUserNav", () => ({
  LoggedUserNav: () => null,
}));

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/EnableWorldId40/SelfManagedTransactionInfo/SelfManagedTransactionInfoContent",
  () => ({ SelfManagedTransactionInfoContent: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/EnableWorldId40/SelfManagedTransactionInfo/SelfManagedTransactionInfoContent",
  () => ({ SelfManagedTransactionInfoContent: () => null }),
);
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/GenerateNewKey/GenerateNewKeyContent",
  () => ({ GenerateNewKeyContent: mockGenerateKeyStep }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/GenerateNewKey/GenerateNewKeyContent",
  () => ({ GenerateNewKeyContent: mockGenerateKeyStep }),
);
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/UseExistingKey/UseExistingKeyContent",
  () => ({ UseExistingKeyContent: mockExistingKeyStep }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/UseExistingKey/UseExistingKeyContent",
  () => ({ UseExistingKeyContent: mockExistingKeyStep }),
);

import { CreateAppDialogV4 as PortalDialog } from "@/scenes/Portal/layout/CreateAppDialog/index-v4";
import { CreateAppDialogV4 as PortalV3Dialog } from "@/scenes/PortalV3/layout/CreateAppDialog/index-v4";

const cases = [
  ["Portal", "generate", PortalDialog],
  ["Portal", "existing", PortalDialog],
  ["PortalV3", "generate", PortalV3Dialog],
  ["PortalV3", "existing", PortalV3Dialog],
] as const;

beforeEach(() => {
  mockKeyStepReady = false;
  mockPendingKeyStep = new Promise((resolve) => {
    mockResolvePendingKeyStep = () => {
      mockKeyStepReady = true;
      resolve();
    };
  });
});

it.each(cases)(
  "%s keeps Configure visible while the %s key step suspends",
  async (_portal, setup, DialogComponent) => {
    render(
      <Suspense fallback={<div data-testid="outer-loading" />}>
        <DialogComponent
          appId="app_00000000000000000000000000000000"
          initialStep="enable-world-id-4-0"
          onClose={jest.fn()}
          open
        />
      </Suspense>,
    );

    fireEvent.click(screen.getByTestId("button-enable-world-id-40-continue"));
    await screen.findByText("Configure Signer Key");

    if (setup === "existing") {
      fireEvent.click(screen.getByTestId("radio-existing"));
    }

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("button-configure-signer-key-continue"),
      );
    });

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Configure Signer Key"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Loading signer key step" }),
    ).toBeDisabled();
    expect(screen.queryByTestId("outer-loading")).not.toBeInTheDocument();

    await act(async () => {
      mockResolvePendingKeyStep();
      await mockPendingKeyStep;
    });

    expect(
      await within(dialog).findByTestId(`${setup}-key-step`),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Configure Signer Key"),
    ).not.toBeInTheDocument();
  },
);
