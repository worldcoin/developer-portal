/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { act } from "react";
import { Role_Enum } from "@/graphql/graphql";
import { ApiKeyRow } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/ApiKeyTable/ApiKeyRow";

// #region Mocks
const resetApiKeyMock = jest.fn();

jest.mock("@apollo/client/react", () => {
  const React = require("react");

  return {
    useMutation: () => {
      const [loading, setLoading] = React.useState(false);
      const mutate = React.useCallback((...args: unknown[]) => {
        setLoading(true);
        return resetApiKeyMock(...args).finally(() => setLoading(false));
      }, []);

      return [mutate, { loading }];
    },
  };
});

let mockSession: unknown;
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: mockSession }),
}));

const toastErrorMock = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

jest.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }: React.PropsWithChildren) => <>{children}</>,
  Trigger: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
  Portal: ({ children }: React.PropsWithChildren) => <>{children}</>,
  Content: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Item: ({ children }: React.PropsWithChildren) => (
    <div role="menuitem">{children}</div>
  ),
}));

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
  formDialogDangerActionClassName: "",
  formDialogPrimaryActionClassName: "",
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/ApiKeySecretFields",
  () => ({
    ApiKeySecretFields: ({ apiKey }: { apiKey: string }) => (
      <code>{apiKey}</code>
    ),
  }),
);

jest.mock(
  "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/ApiKeyTable/ApiKeyRow/graphql/client/reset-api-key.generated",
  () => ({ ResetApiKeyDocument: { __mockDoc: "resetApiKey" } }),
);
jest.mock(
  "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated",
  () => ({ FetchKeysDocument: { __mockDoc: "fetchKeys" } }),
);
// #endregion

// #region Test Data
const API_KEY = {
  __typename: "api_key" as const,
  id: "key_1",
  team_id: "team_1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  is_active: true,
  name: "production",
};

const NEW_SECRET = "api_NEW_SECRET";
const mutationResult = {
  data: { reset_api_key: { api_key: NEW_SECRET } },
};

const sessionWithRole = (role: Role_Enum) => ({
  hasura: { memberships: [{ role, team: { id: "team_1" } }] },
});

const renderRow = () =>
  render(
    <ApiKeyRow
      apiKey={API_KEY}
      index={0}
      teamId="team_1"
      openViewDetails={jest.fn()}
      openDeleteKeyModal={jest.fn()}
    />,
  );

const openRotation = () => {
  renderRow();
  fireEvent.click(screen.getByRole("button", { name: /^rotate key$/i }));
};

const confirmation = () => screen.getByRole("dialog");
const confirmRotation = () =>
  within(confirmation()).getByRole("button", { name: /^rotate key$/i });

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = sessionWithRole(Role_Enum.Owner);
  resetApiKeyMock.mockResolvedValue(mutationResult);
});
// #endregion

// #region Rotation flow
describe("API key rotation flow", () => {
  it("requires confirmation and can be cancelled without rotating", () => {
    openRotation();

    expect(resetApiKeyMock).not.toHaveBeenCalled();

    fireEvent.click(
      within(confirmation()).getByRole("button", {
        name: /keep current key/i,
      }),
    );

    expect(resetApiKeyMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("rotates the selected key and reveals the returned secret", async () => {
    openRotation();

    await act(async () => {
      fireEvent.click(confirmRotation());
    });

    expect(resetApiKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: "key_1", team_id: "team_1" },
      }),
    );
    expect(screen.getByText(NEW_SECRET)).toBeInTheDocument();
  });

  it("prevents a second rotation while the first is in flight", async () => {
    let resolveMutation!: (value: typeof mutationResult) => void;
    resetApiKeyMock.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve;
      }),
    );

    openRotation();
    fireEvent.click(confirmRotation());
    fireEvent.click(confirmRotation());

    expect(resetApiKeyMock).toHaveBeenCalledTimes(1);
    expect(confirmRotation()).toBeDisabled();

    await act(async () => resolveMutation(mutationResult));
  });

  it("reports a failed rotation without revealing a secret", async () => {
    resetApiKeyMock.mockRejectedValue(new Error("network error"));
    openRotation();

    await act(async () => {
      fireEvent.click(confirmRotation());
    });

    expect(toastErrorMock).toHaveBeenCalledWith(
      "Error occurred while resetting API key.",
    );
    expect(screen.queryByText(NEW_SECRET)).not.toBeInTheDocument();
  });

  it("does not expose rotation controls to non-owners", () => {
    mockSession = sessionWithRole(Role_Enum.Admin);
    renderRow();

    expect(
      screen.queryByRole("button", { name: /^rotate key$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reset to view/i }),
    ).not.toBeInTheDocument();
  });
});
// #endregion
