/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { act } from "react";
import { CombinedGraphQLErrors } from "@apollo/client";
import { Role_Enum } from "@/graphql/graphql";
import { ApiKeyRow } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/ApiKeyTable/ApiKeyRow";

// #region Mocks
// The real I/O boundary. The stateful wrapper below drives `loading` from it.
const resetApiKeyMock = jest.fn();

// Stateful tuple on purpose: ApiKeyRow's `if (loading) return false` guard reads
// this value, so a flat [fn, { loading: false }] would turn the in-flight case
// into a tautology. `React` is out of scope inside a jest.mock factory.
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

// ApiKeyRow reads user.hasura.memberships directly, so mocking
// checkUserPermissions would have no effect -- the session itself is the gate.
let mockSession: unknown;
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: mockSession }),
}));

const toastSuccess = jest.fn();
const toastError = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

// Flattened Radix primitives (precedent: portal-v3-apps-dropdown.test.tsx).
// Item must NOT be a <button>: Dropdown.ListItem forwards `asChild`, and the
// real menu entries are <button onClick> children. A <div role="menuitem">
// wrapper never receives their click -- events bubble up, not down -- so every
// activation below goes through the inner button.
jest.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }: React.PropsWithChildren) => <>{children}</>,
  Trigger: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
  Portal: ({ children }: React.PropsWithChildren) => <>{children}</>,
  Content: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Item: ({
    children,
    onSelect,
    asChild,
    ...props
  }: React.ComponentProps<"div"> & {
    onSelect?: () => void;
    asChild?: boolean;
  }) => (
    <div role="menuitem" onClick={onSelect} {...props}>
      {children}
    </div>
  ),
}));

// Headless UI portal/transition machinery is not the subject. Rendering the
// open dialog as role="dialog" is what makes within(dialog) scoping work.
jest.mock("@/components/Dialog", () => ({
  Dialog: ({ open, children }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div role="dialog">{children}</div> : null,
}));
jest.mock("@/components/DialogOverlay", () => ({ DialogOverlay: () => null }));
jest.mock("@/components/DialogPanel", () => ({
  DialogPanel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

// Keeps this file off ApiKeySecretFields (clipboard + window.location).
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/ApiKeySecretModal",
  () => ({
    ApiKeySecretModal: ({ isOpen }: { isOpen: boolean }) => (
      <div data-testid="secret-modal" data-open={String(isOpen)} />
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
// CombinedGraphQLErrors stays real -- it comes from the @apollo/client root,
// a different specifier from the mocked /react subpath, and case 8 depends on
// its actual shape narrowing.
// #endregion

// #region Test Data
const sessionWithRole = (role: string) => ({
  hasura: { memberships: [{ role, team: { id: "team_1" } }] },
});

const API_KEY = {
  __typename: "api_key" as const,
  id: "key_1",
  team_id: "team_1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  is_active: true,
  name: "prod-mcp",
};

const NEW_SECRET = { data: { reset_api_key: { api_key: "api_NEWSECRET" } } };

const openViewDetails = jest.fn();
const openDeleteKeyModal = jest.fn();

const renderRow = (apiKey = API_KEY) =>
  render(
    <ApiKeyRow
      apiKey={apiKey}
      index={0}
      teamId="team_1"
      openViewDetails={openViewDetails}
      openDeleteKeyModal={openDeleteKeyModal}
    />,
  );

// The real control inside the menu row -- see the Radix stub comment.
const menuButton = (name: RegExp) =>
  within(screen.getByRole("menuitem", { name })).getByRole("button");

const dialog = () => screen.getByRole("dialog");
// Query by accessible name, never by index: DeleteKeyModal (and this modal)
// put the destructive button first in source and reorder it with CSS.
const confirmButton = () =>
  within(dialog()).getByRole("button", { name: /^rotate key$/i });
const cancelButton = () =>
  within(dialog()).getByRole("button", { name: /cancel|keep/i });

const secretModal = () => screen.getByTestId("secret-modal");

const openConfirm = () => {
  renderRow();
  fireEvent.click(menuButton(/rotate key/i));
};

const clickConfirm = async () => {
  await act(async () => {
    fireEvent.click(confirmButton());
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = sessionWithRole(Role_Enum.Owner);
  // The mocked useMutation calls .finally on this, so it must be a promise.
  resetApiKeyMock.mockResolvedValue(NEW_SECRET);
});
// #endregion

// #region Status semantics
describe("ApiKeyRow status", () => {
  it("labels a reversibly disabled key as inactive, not revoked", () => {
    renderRow({ ...API_KEY, is_active: false });

    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.queryByText("Revoked")).not.toBeInTheDocument();
  });
});
// #endregion

// #region Confirmation gate
describe("ApiKeyRow rotate [confirmation gate]", () => {
  it("opens a confirmation and mutates nothing when Rotate key is chosen", () => {
    openConfirm();

    // The whole point of the change: choosing the menu item is not the rotation.
    expect(resetApiKeyMock).not.toHaveBeenCalled();

    const confirm = dialog();
    // Names which key, and names the consequence.
    expect(within(confirm).getByText(/prod-mcp/)).toBeInTheDocument();
    expect(
      within(confirm).getByText(
        /will stop working|stop working|become invalid/i,
      ),
    ).toBeInTheDocument();

    // The rename, scoped to the menu so the confirm button cannot mask it.
    expect(
      screen.queryByRole("menuitem", { name: /^reset key$/i }),
    ).not.toBeInTheDocument();
  });

  it("rotates exactly once and reveals the new secret when confirmed", async () => {
    openConfirm();
    await clickConfirm();

    expect(resetApiKeyMock).toHaveBeenCalledTimes(1);
    expect(resetApiKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: "key_1", team_id: "team_1" },
        // The tagged FetchKeysDocument: the row refetches the key list, not
        // some other document.
        refetchQueries: [{ __mockDoc: "fetchKeys" }],
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith("API key was reset");
    expect(secretModal()).toHaveAttribute("data-open", "true");
    // Both open at once would trap focus behind two overlays.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not rotate when the confirmation is cancelled", () => {
    openConfirm();

    fireEvent.click(cancelButton());

    expect(resetApiKeyMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(menuButton(/rotate key/i)).toBeInTheDocument();
  });

  it("locks the confirm control while a rotation is in flight", async () => {
    let resolveMutation!: (value: unknown) => void;
    resetApiKeyMock.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve;
      }),
    );

    openConfirm();
    // No await between the two clicks -- this is the double-click a user makes
    // when the first one appears to do nothing. Rotating twice burns the key
    // that was just copied.
    fireEvent.click(confirmButton());
    fireEvent.click(confirmButton());

    expect(resetApiKeyMock).toHaveBeenCalledTimes(1);
    expect(confirmButton()).toBeDisabled();

    await act(async () => {
      resolveMutation(NEW_SECRET);
    });

    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(secretModal()).toHaveAttribute("data-open", "true");
  });
});
// #endregion

// #region Failure paths
describe("ApiKeyRow rotate [failures]", () => {
  it("surfaces an error and leaves no secret modal open when the rotation rejects", async () => {
    resetApiKeyMock.mockRejectedValue(new Error("network down"));

    openConfirm();
    await clickConfirm();

    expect(toastError).toHaveBeenCalledWith(
      "Error occurred while resetting API key.",
    );
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(secretModal()).toHaveAttribute("data-open", "false");
    // The in-flight lock must release on failure, and the dialog must stay open
    // so the user can retry -- the classic set-before-await/clear-on-success brick.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it("treats a resolved-with-error result as a failure", async () => {
    // Different branch from the reject: Boolean(result?.error).
    resetApiKeyMock.mockResolvedValue({ error: new Error("gql") });

    openConfirm();
    await clickConfirm();

    expect(toastError).toHaveBeenCalledWith(
      "Error occurred while resetting API key.",
    );
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(secretModal()).toHaveAttribute("data-open", "false");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not report success when the rotation returns no secret", async () => {
    // The mutation already committed server-side and has no rollback, so this
    // is not the same failure as the mutation never running.
    resetApiKeyMock.mockResolvedValue({ data: { reset_api_key: null } });

    openConfirm();
    await clickConfirm();

    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      expect.stringMatching(/could not be shown/i),
    );
    expect(secretModal()).toHaveAttribute("data-open", "false");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("explains that the key must be active on an inactive-key permission error", async () => {
    resetApiKeyMock.mockRejectedValue(
      new CombinedGraphQLErrors({
        data: null,
        errors: [{ message: "User does not have sufficient permissions." }],
      }),
    );

    openConfirm();
    await clickConfirm();

    expect(toastError).toHaveBeenCalledWith("API key must be active to reset.");
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Permissions and sibling actions
describe("ApiKeyRow menu [permissions]", () => {
  it("renders no rotate control at all for a non-owner", () => {
    mockSession = sessionWithRole(Role_Enum.Admin);
    renderRow();

    // A render guard, not a Tailwind `hidden` class: jsdom loads no stylesheet,
    // so a CSS gate is untestable and ships dead OWNER-only DOM to non-owners.
    expect(
      screen.queryByRole("menuitem", { name: /rotate key/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /remove key/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /edit key/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /rotate key/i }),
    ).not.toBeInTheDocument();
  });

  it("still invokes the Edit key and Remove key callbacks", () => {
    renderRow();

    fireEvent.click(menuButton(/edit key/i));
    expect(openViewDetails).toHaveBeenCalledWith(
      expect.objectContaining({ id: "key_1" }),
    );

    fireEvent.click(menuButton(/remove key/i));
    expect(openDeleteKeyModal).toHaveBeenCalledWith(
      expect.objectContaining({ id: "key_1" }),
    );

    expect(resetApiKeyMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
// #endregion
