/** @jest-environment jsdom */
// Regression test for the v3 onboarding "Start" button: it opens the
// create-app dialog by writing `createAppDialogOpenedAtom`, but the only
// v3 mount of CreateAppDialogV4 (AppsDropdown) used to be driven solely by
// local useState, disconnected from the atom. A fresh v3 user landing on
// onboarding and clicking "Start" got nothing. This pins the real seam:
// flipping the shared atom must actually open the mounted dialog, not just
// flip a piece of state nobody reads.
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider, useSetAtom } from "jotai";
import React from "react";
import { createAppDialogOpenedAtom } from "@/scenes/common/layout/Header/atoms";

// Control the apps query result per test.
const fetchApps = jest.fn();
jest.mock(
  "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated",
  () => ({
    useFetchAppsQuery: () => fetchApps(),
  }),
);

// The create-app dialog pulls in a heavy subtree; stub it, following the
// mock precedent in tests/unit/portal-v3-apps-dropdown.test.tsx. The marker
// is gated on `open` so the assertion proves the prop propagates from the
// atom, rather than merely proving the atom flipped.
jest.mock("@/scenes/PortalV3/layout/CreateAppDialog/index-v4", () => ({
  CreateAppDialogV4: (props: { open: boolean }) =>
    props.open ? <div data-testid="create-app-dialog" /> : null,
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { name: "Ada" } }),
}));

// canCreateApp = true so AppsDropdown actually mounts CreateAppDialogV4.
jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ teamId: "team_1" }),
}));

import { AppsDropdown } from "@/scenes/PortalV3/layout/Shell/AppsDropdown";

beforeEach(() => jest.clearAllMocks());

// Sibling probe that writes the atom the same way the onboarding page's
// "Start" button does (see PortalV3/Teams/TeamId/Apps/page/ClientPage),
// without pulling in that whole page.
const OpenDialogProbe = () => {
  const setOpen = useSetAtom(createAppDialogOpenedAtom);
  return (
    <button onClick={() => setOpen(true)} data-testid="probe-open">
      open
    </button>
  );
};

it("opens the create-app dialog mounted in AppsDropdown when the shared atom flips true", () => {
  fetchApps.mockReturnValue({
    data: { app: [{ id: "app_1", app_metadata: [{ name: "My App" }] }] },
    loading: false,
    error: undefined,
  });

  const store = createStore();

  render(
    <Provider store={store}>
      <OpenDialogProbe />
      <AppsDropdown />
    </Provider>,
  );

  // Dialog is closed initially — local state and atom both false.
  expect(screen.queryByTestId("create-app-dialog")).not.toBeInTheDocument();

  // Simulate the onboarding page's "Start" button writing the atom.
  fireEvent.click(screen.getByTestId("probe-open"));

  // The dialog mounted by AppsDropdown must actually open in response.
  expect(screen.getByTestId("create-app-dialog")).toBeInTheDocument();
});
