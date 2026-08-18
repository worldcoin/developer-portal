/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React, { Suspense } from "react";

let mockKeyStepReady = false;
let mockPendingKeyStep: Promise<void>;
let mockResolvePendingKeyStep: () => void;
const registerRp = jest.fn();
const refresh = jest.fn();

function mockGenerateKeyStep(props: {
  onContinue: (publicKey: string) => void;
  loading?: boolean;
  loadingLabel?: string;
}) {
  if (!mockKeyStepReady) {
    throw mockPendingKeyStep;
  }

  return (
    <button
      type="button"
      data-testid="generate-key-step"
      disabled={props.loading}
      onClick={() =>
        props.onContinue("0x1234567890abcdef1234567890abcdef12345678")
      }
    >
      {props.loading ? props.loadingLabel : "Generate key step loaded"}
    </button>
  );
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
  useMutation: () => [registerRp, { loading: false }],
}));
jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_1" }),
  useRouter: () => ({ refresh, replace: jest.fn() }),
}));
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));
// The PortalV3 dialog renders through FormDialog (modal flow).
jest.mock("@/components/FormDialog", () => ({
  FormDialog: ({
    children,
    open,
    title,
  }: React.PropsWithChildren<{ open: boolean; title: React.ReactNode }>) =>
    open ? (
      <div role="dialog">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
  formDialogErrorClassName: "",
  formDialogInputClassName: "",
  formDialogLabelClassName: "",
  formDialogPrimaryActionClassName: "",
  formDialogSecondaryActionClassName: "",
}));
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/GenerateNewKey/GenerateNewKeyContent",
  () => ({ GenerateNewKeyContent: mockGenerateKeyStep }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/UseExistingKey/UseExistingKeyContent",
  () => ({ UseExistingKeyContent: mockExistingKeyStep }),
);

import { RegisterRpDialog as PortalV3Dialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/EnableWorldId40/Dialog";

const cases = [["generate"], ["existing"]] as const;

beforeEach(() => {
  jest.clearAllMocks();
  mockKeyStepReady = false;
  mockPendingKeyStep = new Promise((resolve) => {
    mockResolvePendingKeyStep = () => {
      mockKeyStepReady = true;
      resolve();
    };
  });
});

it.each(cases)(
  "keeps Configure visible while the %s key step suspends",
  async (setup) => {
    render(
      <Suspense fallback={<div data-testid="outer-loading" />}>
        <PortalV3Dialog
          appId="app_00000000000000000000000000000000"
          onClose={jest.fn()}
          open
        />
      </Suspense>,
    );

    await screen.findByText(/configure signer key/i);

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
      within(dialog).getByText(/configure signer key/i),
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
      within(dialog).queryByText(/configure signer key/i),
    ).not.toBeInTheDocument();
  },
);

it("PortalV3 registers the relying party in managed mode", async () => {
  mockKeyStepReady = true;
  registerRp.mockResolvedValue({
    data: { register_rp: { rp_id: "rp_1234567890abcdef" } },
  });
  let resolveOverviewRefresh: () => void = () => {};
  const onComplete = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        resolveOverviewRefresh = resolve;
      }),
  );
  const onClose = jest.fn();

  render(
    <PortalV3Dialog
      appId="app_00000000000000000000000000000000"
      onComplete={onComplete}
      onClose={onClose}
      open
    />,
  );

  expect(screen.getByText("Configure signer key")).toBeInTheDocument();
  expect(screen.queryByText("Enable World ID")).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("button-configure-signer-key-continue"));
  fireEvent.click(await screen.findByTestId("generate-key-step"));

  await waitFor(() =>
    expect(registerRp).toHaveBeenCalledWith({
      variables: {
        app_id: "app_00000000000000000000000000000000",
        mode: "managed",
        signer_address: "0x1234567890abcdef1234567890abcdef12345678",
      },
    }),
  );
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(await screen.findByText("Finishing setup…")).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();

  await act(async () => resolveOverviewRefresh());

  await waitFor(() => expect(onClose).toHaveBeenCalledWith(false));
});
