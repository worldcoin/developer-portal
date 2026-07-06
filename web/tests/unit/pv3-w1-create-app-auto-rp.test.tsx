/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { name: "Ada" }, invalidate: jest.fn() }),
}));

// LoggedUserNav (rendered by the dialog's header, untouched by this task)
// pulls in the real @/lib/utils, which pulls in idkit/ox — that needs
// TextEncoder, which jsdom doesn't provide. Stub with just the one export
// LoggedUserNav actually uses, per the existing dropdown-test precedent.
jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
  getNullifierName: () => null,
}));

// useRefetchQueries needs an ApolloProvider in the tree; it's a leaf
// dependency here (unchanged by this task), so stub it directly.
const refetchApps = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/use-refetch-queries", () => ({
  useRefetchQueries: () => ({ refetch: refetchApps }),
}));

// The dialog's header renders the real LoggedUserNav (untouched by this
// task), which transitively calls several generated Apollo hooks living
// under @/components/... (not alias-mappable in this jest config — only
// @/api, @/lib, @/scenes are). Stub Apollo itself at the real npm-package
// boundary so every generated hook gets a safe, empty/loading-false result
// with no network calls. (Class is declared inside the factory — jest.mock
// factories run before top-level `class`/`const` declarations initialize.)
jest.mock("@apollo/client", () => {
  class MockApolloError extends Error {
    graphQLErrors: { extensions?: { code?: string } }[];
    constructor(code?: string) {
      super("registration failed");
      this.name = "ApolloError";
      this.graphQLErrors = code ? [{ extensions: { code } }] : [];
    }
  }
  return {
    ApolloError: MockApolloError,
    gql: () => ({}),
    useQuery: () => ({ data: undefined, loading: false }),
    useApolloClient: () => ({}),
  };
});

jest.mock("posthog-js", () => ({ capture: jest.fn() }));

const push = jest.fn();
const replace = jest.fn();
const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh }),
  useParams: () => ({ teamId: "team_1" }),
}));

const validateAndInsertAppServerSideV4 = jest.fn();
jest.mock("@/scenes/common/layout/CreateAppDialog/server/v4/submit", () => ({
  validateAndInsertAppServerSideV4: (...a: unknown[]) =>
    validateAndInsertAppServerSideV4(...a),
}));

const registerRpMock = jest.fn();
jest.mock(
  "@/scenes/common/layout/CreateAppDialog/client/register-rp.generated",
  () => ({
    useRegisterRpMutation: () => [registerRpMock, { loading: false }],
  }),
);

// Returns DISTINCT wallets per call (call N -> 0xADDRN / 0xPRIVN) so tests
// can catch a regression where a retry generates a fresh key instead of
// reusing the one already registered.
let walletCallCount = 0;
jest.mock("ethers", () => ({
  Wallet: {
    createRandom: () => {
      walletCallCount += 1;
      return {
        address: `0xADDR${walletCallCount}`,
        privateKey: `0xPRIV${walletCallCount}`,
      };
    },
  },
}));

// #endregion

import { ApolloError } from "@apollo/client";
import posthog from "posthog-js";
import { CreateAppDialogV4 } from "@/scenes/PortalV3/layout/CreateAppDialog/index-v4";

const apolloError = (code?: string) =>
  new (ApolloError as unknown as new (code?: string) => Error)(code);

beforeEach(() => {
  jest.clearAllMocks();
  refetchApps.mockResolvedValue(undefined);
  walletCallCount = 0;
});

const fillAndSubmit = async (name = "My App") => {
  const input = screen.getByTestId("input-app-name");
  fireEvent.change(input, { target: { value: name } });
  const submitBtn = await screen.findByTestId("button-create-app");
  await waitFor(() => expect(submitBtn).not.toBeDisabled());
  fireEvent.click(submitBtn);
};

const renderDialog = () => {
  const onClose = jest.fn();
  render(<CreateAppDialogV4 open onClose={onClose} />);
  return { onClose };
};

// No posthog capture payload should ever contain the raw private key.
const assertNoKeyLeak = (privateKey: string) => {
  const capture = posthog.capture as jest.Mock;
  for (const call of capture.mock.calls) {
    expect(JSON.stringify(call)).not.toContain(privateKey);
  }
};

describe("CreateAppDialogV4 — auto RP registration", () => {
  it("happy path: registers RP as managed, shows key, navigates only after explicit confirm", async () => {
    validateAndInsertAppServerSideV4.mockResolvedValue({
      success: true,
      message: "App created successfully",
      app_id: "app_123",
    });
    registerRpMock.mockResolvedValue({
      data: { register_rp: { rp_id: "rp_1" } },
    });

    const { onClose } = renderDialog();
    await fillAndSubmit();

    await waitFor(() =>
      expect(validateAndInsertAppServerSideV4).toHaveBeenCalledWith(
        expect.objectContaining({ name: "My App" }),
        "team_1",
      ),
    );

    await waitFor(() =>
      expect(registerRpMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            app_id: "app_123",
            mode: "managed",
            signer_address: "0xADDR1",
          },
          context: { fetchOptions: { timeout: 30000 } },
        }),
      ),
    );

    // key-ready screen
    expect(await screen.findByText("0xPRIV1")).toBeInTheDocument();

    // No navigation before the explicit confirm click.
    expect(replace).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();

    assertNoKeyLeak("0xPRIV1");

    const confirmBtn = screen.getByText("I saved my key — go to my app");
    fireEvent.click(confirmBtn);

    expect(replace).toHaveBeenCalledWith("/teams/team_1/apps/app_123");
    expect(refresh).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it("registerRp rejects: shows register-failed with retry/continue, app-created copy", async () => {
    validateAndInsertAppServerSideV4.mockResolvedValue({
      success: true,
      message: "App created successfully",
      app_id: "app_456",
    });
    registerRpMock.mockRejectedValue(apolloError("internal_error"));

    renderDialog();
    await fillAndSubmit();

    expect(await screen.findByText("Retry registration")).toBeInTheDocument();
    expect(screen.getByText("Continue without setup")).toBeInTheDocument();
    expect(
      screen.getByText(/app.*created/i, { exact: false }),
    ).toBeInTheDocument();

    expect(screen.queryByText("0xPRIV1")).not.toBeInTheDocument();
    assertNoKeyLeak("0xPRIV1");
  });

  it("already_registered error is treated as success -> key-ready, no failure UI", async () => {
    validateAndInsertAppServerSideV4.mockResolvedValue({
      success: true,
      message: "App created successfully",
      app_id: "app_789",
    });
    registerRpMock.mockRejectedValue(apolloError("already_registered"));

    renderDialog();
    await fillAndSubmit();

    expect(await screen.findByText("0xPRIV1")).toBeInTheDocument();
    expect(screen.queryByText("Retry registration")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Continue without setup"),
    ).not.toBeInTheDocument();
  });

  it("retry from register-failed reuses the SAME signer key (no orphaned registration)", async () => {
    validateAndInsertAppServerSideV4.mockResolvedValue({
      success: true,
      message: "App created successfully",
      app_id: "app_999",
    });
    registerRpMock.mockRejectedValueOnce(apolloError("internal_error"));

    renderDialog();
    await fillAndSubmit();

    const retryBtn = await screen.findByText("Retry registration");

    registerRpMock.mockResolvedValueOnce({
      data: { register_rp: { rp_id: "rp_2" } },
    });
    fireEvent.click(retryBtn);

    // key-ready shows the FIRST generated key, not a freshly-generated one.
    // Without Fix 1 (reuse-existing-key), the second call would generate
    // 0xADDR2/0xPRIV2 and this assertion would fail.
    expect(await screen.findByText("0xPRIV1")).toBeInTheDocument();
    expect(registerRpMock).toHaveBeenCalledTimes(2);

    const [firstCallArgs] = registerRpMock.mock.calls[0];
    const [secondCallArgs] = registerRpMock.mock.calls[1];
    expect(secondCallArgs.variables.signer_address).toBe(
      firstCallArgs.variables.signer_address,
    );
    expect(secondCallArgs.variables.signer_address).toBe("0xADDR1");
  });

  it("dismissal (Escape) during key-ready is ignored: onClose not called, key still shown", async () => {
    validateAndInsertAppServerSideV4.mockResolvedValue({
      success: true,
      message: "App created successfully",
      app_id: "app_555",
    });
    registerRpMock.mockResolvedValue({
      data: { register_rp: { rp_id: "rp_1" } },
    });

    const { onClose } = renderDialog();
    await fillAndSubmit();

    expect(await screen.findByText("0xPRIV1")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("0xPRIV1")).toBeInTheDocument();
  });
});
