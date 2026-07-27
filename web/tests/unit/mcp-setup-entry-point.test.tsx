/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AppsPageClient } from "@/scenes/PortalV3/Teams/TeamId/Apps/page/AppsPageClient";
import { Role_Enum } from "@/graphql/graphql";

// #region Mocks
// Session boundary. Mutable so a test can pick the role, or drop the user
// entirely to exercise the SSR fallback.
let mockSession: unknown;
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: mockSession }),
}));

// Real @/lib/utils transitively pulls in idkit/ox, which needs TextEncoder.
// This is a faithful reimplementation of checkUserPermissions wrapped in a spy
// -- NOT a constant `true`, which would erase the branch under test.
const checkUserPermissionsMock = jest.fn(
  (user: any, teamId: string, roles: string[]) => {
    const membership = user?.hasura?.memberships?.find(
      (m: any) => m.team?.id === teamId,
    );
    return membership ? roles.includes(membership.role) : false;
  },
);
jest.mock("@/lib/utils", () => ({
  checkUserPermissions: (
    ...args: Parameters<typeof checkUserPermissionsMock>
  ) => checkUserPermissionsMock(...args),
}));

// Prop-discriminating dialog stub. AppsPageClient dynamics two different
// dialogs; a single undifferentiated stub would make the independent-state
// case unwritable. CreateAppDialogV4 takes open/onClose, CreateKeyModal takes
// isOpen/setIsOpen -- "isOpen" is the discriminator.
const DialogStub = (props: any) => {
  const isKeyModal = "isOpen" in props;
  return (
    <div
      data-testid={isKeyModal ? "create-key-modal" : "create-app-dialog"}
      data-open={String(isKeyModal ? props.isOpen : props.open)}
      data-team-id={props.teamId}
    >
      {/* Distinct testids: the mirror half of the independence case has both
          dialogs mounted at once, so a shared label would be ambiguous. */}
      <button
        type="button"
        data-testid={isKeyModal ? "close-key-dialog" : "close-app-dialog"}
        onClick={() =>
          isKeyModal ? props.setIsOpen(false) : props.onClose(false)
        }
      >
        close-dialog
      </button>
    </div>
  );
};

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => (props: any) => <DialogStub {...props} />,
}));

// Belt-and-braces: keeps the suite honest if CreateKeyModal is ever imported
// statically instead of through next/dynamic.
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/CreateKeyModal",
  () => ({
    CreateKeyModal: (props: any) => <DialogStub {...props} />,
  }),
);

// AppsPageClient does not import next/navigation today. The mock exists so the
// "never navigates" assertions stay writable (and keep failing loudly) if
// someone reintroduces a router push.
const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/teams/team_1/apps",
  useParams: () => ({ teamId: "team_1" }),
}));

// The return-path app check. fetchAppsMock is module-level so every render
// gets the same execute identity -- the component's effect depends on it.
const fetchAppsMock = jest.fn();
const useLazyQueryMock = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useLazyQuery: (...args: unknown[]) => useLazyQueryMock(...args),
}));
jest.mock(
  "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated",
  () => ({ FetchAppsDocument: { __mockDoc: "fetchApps" } }),
);
// #endregion

// #region Test Data
const sessionWithRole = (role: string) => ({
  hasura: { memberships: [{ role, team: { id: "team_1" } }] },
});

// @/components/Button returns null when given neither href nor type
// (components/Button/index.tsx:29), so a CTA written without type="button"
// silently disappears. Querying by *role* is the tripwire -- do not relax
// these to getByText.
const createKeyButton = () =>
  screen.queryByRole("button", { name: /create api key/i });
const createKeyLink = () =>
  screen.queryByRole("link", { name: /create api key/i });

const originalLocation = window.location;
const locationReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = sessionWithRole(Role_Enum.Owner);
  // Same array every render: a fresh tuple would re-run the return-path effect.
  useLazyQueryMock.mockReturnValue([fetchAppsMock, { loading: false }]);
  // A bare jest.fn() would hand checkForApp undefined to .catch and turn every
  // key-dialog close in the older regions into an unhandled rejection.
  fetchAppsMock.mockResolvedValue({ data: { app: [] } });
  Object.defineProperty(window, "location", {
    value: { replace: locationReplace },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});
// #endregion

// #region CTA opens the dialog in place
describe("AppsPageClient MCP card [in-place dialog]", () => {
  it("opens the create-key dialog instead of navigating to team settings", () => {
    render(<AppsPageClient teamId="team_1" />);

    // The regression was a <Button href> -- Button renders a NextLink whenever
    // href is truthy, so a revert fails here without touching the router.
    expect(createKeyLink()).toBeNull();

    fireEvent.click(createKeyButton()!);

    const modal = screen.getByTestId("create-key-modal");
    expect(modal).toHaveAttribute("data-open", "true");
    expect(modal).toHaveAttribute("data-team-id", "team_1");
    expect(createKeyLink()).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("does not mount either dialog until its button is clicked", () => {
    render(<AppsPageClient teamId="team_1" />);

    expect(screen.queryByTestId("create-key-modal")).toBeNull();
    expect(screen.queryByTestId("create-app-dialog")).toBeNull();
  });

  it("keeps the dialog mounted after it closes and reopens it", () => {
    render(<AppsPageClient teamId="team_1" />);

    fireEvent.click(createKeyButton()!);
    fireEvent.click(screen.getByTestId("close-key-dialog"));

    // Still in the DOM: {open && <Modal/>} would unmount mid-transition and
    // lose the form state the user already typed.
    expect(screen.getByTestId("create-key-modal")).toHaveAttribute(
      "data-open",
      "false",
    );

    fireEvent.click(createKeyButton()!);
    expect(screen.getByTestId("create-key-modal")).toHaveAttribute(
      "data-open",
      "true",
    );
  });

  it("controls the create-key and create-app dialogs independently", () => {
    render(<AppsPageClient teamId="team_1" />);

    fireEvent.click(createKeyButton()!);
    expect(screen.getByTestId("create-key-modal")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.queryByTestId("create-app-dialog")).toBeNull();

    // Mirror half runs in the same render, after the key modal has mounted --
    // on a fresh render the lazy mount makes the attribute unassertable.
    fireEvent.click(screen.getByTestId("close-key-dialog"));
    fireEvent.click(screen.getByTestId("button-create-new-app"));

    expect(screen.getByTestId("create-app-dialog")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.getByTestId("create-key-modal")).toHaveAttribute(
      "data-open",
      "false",
    );
  });
});
// #endregion

// #region Permission matrix
describe("AppsPageClient MCP card [permissions]", () => {
  it("gives an Owner an enabled create control gated on the Owner role", () => {
    render(<AppsPageClient teamId="team_1" />);

    expect(createKeyButton()).toBeEnabled();
    expect(checkUserPermissionsMock).toHaveBeenCalledWith(
      expect.anything(),
      "team_1",
      [Role_Enum.Owner],
    );
  });

  describe.each([[Role_Enum.Admin], [Role_Enum.Member]])(
    "as %s",
    (role: Role_Enum) => {
      it("cannot reach the create-key dialog from the MCP card", () => {
        mockSession = sessionWithRole(role);
        render(<AppsPageClient teamId="team_1" />);

        // Implementation-agnostic: passes whether PR4 hides or disables.
        const button = createKeyButton();
        if (button) {
          fireEvent.click(button);
        }

        expect(screen.queryByTestId("create-key-modal")).toBeNull();
        // No anchor escape hatch: a disabled href becomes href="" on a still
        // clickable anchor (components/Button/index.tsx:19).
        expect(createKeyLink()).toBeNull();
        // An over-broad gate must not blank the welcome page for non-Owners.
        expect(screen.getByTestId("button-create-new-app")).toBeInTheDocument();
      });
    },
  );
});
// #endregion

// #region SSR fallback
// useUser() is an SWR fetch with no SSR seed, so a purely client-side gate pops
// the primary CTA in after a round-trip. These cases cover the window before
// the session resolves, where only initialIsOwner can answer.
describe("AppsPageClient MCP card [unresolved session]", () => {
  beforeEach(() => {
    mockSession = undefined;
  });

  it("renders the MCP card from the server's answer when the user is an owner", () => {
    render(<AppsPageClient teamId="team_1" initialIsOwner />);

    expect(createKeyButton()).toBeInTheDocument();
    // The fallback must not consult the (absent) client session.
    expect(checkUserPermissionsMock).not.toHaveBeenCalled();
  });

  it.each([
    ["explicitly false", false],
    ["omitted", undefined],
  ])(
    "hides the MCP card when the server's answer is %s",
    (_label: string, initialIsOwner: boolean | undefined) => {
      render(
        <AppsPageClient teamId="team_1" initialIsOwner={initialIsOwner} />,
      );

      expect(createKeyButton()).toBeNull();
      expect(createKeyLink()).toBeNull();
      expect(screen.getByTestId("button-create-new-app")).toBeInTheDocument();
    },
  );
});
// #endregion

// #region MCP return path
// The first app can be created out-of-band (MCP) while the user sits on this
// page, and the redirect to it lives server-side only -- these triggers are
// the page's sole way to ever learn the app exists.
describe("AppsPageClient [MCP return path]", () => {
  const APP_RESULT = { data: { app: [{ id: "app_123" }] } };

  beforeEach(() => {
    // Modern fake timers patch Date.now, which drives the throttle.
    jest.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const tabReturn = async () => {
    await act(async () => {
      fireEvent(document, new Event("visibilitychange"));
    });
  };

  it("configures the app check to bypass the cache", () => {
    render(<AppsPageClient teamId="team_1" />);

    // cache-first would re-serve this page's own zero-app answer forever --
    // the exact silent staleness under test.
    expect(useLazyQueryMock).toHaveBeenCalledWith(
      { __mockDoc: "fetchApps" },
      { fetchPolicy: "network-only" },
    );
    // Mount alone must not fire a check; the server just answered "zero".
    expect(fetchAppsMock).not.toHaveBeenCalled();
  });

  it("stays put when the tab returns and the team still has no apps", async () => {
    render(<AppsPageClient teamId="team_1" />);

    await tabReturn();

    expect(fetchAppsMock).toHaveBeenCalledTimes(1);
    expect(fetchAppsMock).toHaveBeenCalledWith({
      variables: { teamId: "team_1" },
    });
    expect(locationReplace).not.toHaveBeenCalled();
    expect(createKeyButton()).toBeInTheDocument();
  });

  it("hard-navigates to an app created out-of-band when the tab returns", async () => {
    fetchAppsMock.mockResolvedValue(APP_RESULT);
    render(<AppsPageClient teamId="team_1" />);

    await tabReturn();

    expect(locationReplace).toHaveBeenCalledWith("/teams/team_1/apps/app_123");
    // Hard nav by design: a router.push would keep the session-rendered shell
    // (apps dropdown, sidebar) stale.
    expect(push).not.toHaveBeenCalled();
  });

  it("collapses the visibilitychange+focus double-fire into one check", async () => {
    render(<AppsPageClient teamId="team_1" />);

    // Chrome fires both events on one tab return.
    await act(async () => {
      fireEvent(document, new Event("visibilitychange"));
      fireEvent(window, new Event("focus"));
    });
    expect(fetchAppsMock).toHaveBeenCalledTimes(1);

    // A later, genuine return checks again once the throttle lapses.
    await act(async () => {
      jest.advanceTimersByTime(1_001);
    });
    await act(async () => {
      fireEvent(window, new Event("focus"));
    });
    expect(fetchAppsMock).toHaveBeenCalledTimes(2);
  });

  it("suppresses checks while the key secret is on screen and checks on close", async () => {
    fetchAppsMock.mockResolvedValue(APP_RESULT);
    render(<AppsPageClient teamId="team_1" />);

    fireEvent.click(createKeyButton()!);
    await act(async () => {
      fireEvent(window, new Event("focus"));
      fireEvent(document, new Event("visibilitychange"));
    });

    // Navigating now would destroy the one-shot secret.
    expect(fetchAppsMock).not.toHaveBeenCalled();
    expect(locationReplace).not.toHaveBeenCalled();

    // The likeliest MCP sequence ends here: the agent created the app while
    // the secret was on screen, so the close is the last signal there is.
    await act(async () => {
      fireEvent.click(screen.getByTestId("close-key-dialog"));
    });

    expect(fetchAppsMock).toHaveBeenCalledTimes(1);
    expect(locationReplace).toHaveBeenCalledWith("/teams/team_1/apps/app_123");
  });

  it("ignores a visibilitychange that fires while the tab is hidden", async () => {
    render(<AppsPageClient teamId="team_1" />);

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    await tabReturn();

    expect(fetchAppsMock).not.toHaveBeenCalled();
  });

  it("removes both listeners on unmount", () => {
    const docAdd = jest.spyOn(document, "addEventListener");
    const docRemove = jest.spyOn(document, "removeEventListener");
    const winAdd = jest.spyOn(window, "addEventListener");
    const winRemove = jest.spyOn(window, "removeEventListener");

    const view = render(<AppsPageClient teamId="team_1" />);

    const visHandler = docAdd.mock.calls.find(
      ([type]) => type === "visibilitychange",
    )![1];
    const focusHandler = winAdd.mock.calls.find(
      ([type]) => type === "focus",
    )![1];

    view.unmount();

    expect(docRemove).toHaveBeenCalledWith("visibilitychange", visHandler);
    expect(winRemove).toHaveBeenCalledWith("focus", focusHandler);
  });
});
// #endregion
