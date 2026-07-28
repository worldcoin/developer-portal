/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import React from "react";

// #region Mocks
jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_1" }),
}));

const mockValidateAndInsertApp = jest.fn();
jest.mock("@/scenes/common/layout/CreateAppDialog/server/v4/submit", () => ({
  validateAndInsertAppServerSideV4: (
    ...args: Parameters<typeof mockValidateAndInsertApp>
  ) => mockValidateAndInsertApp(...args),
}));

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { capture: jest.fn() },
}));

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
}));

jest.mock("@/components/DialogOverlay", () => ({
  DialogOverlay: () => <div data-testid="dialog-overlay" />,
}));

jest.mock("@/components/Dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
}));

jest.mock("@/components/DialogPanel", () => ({
  DialogPanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@headlessui/react", () => ({
  DialogTitle: ({ children, ...props }: React.ComponentProps<"h2">) => (
    <h2 {...props}>{children}</h2>
  ),
}));
// #endregion

import { CreateAppDialog } from "@/scenes/common/layout/CreateAppDialog";
import { useCreateAppDialog } from "@/scenes/common/layout/CreateAppDialog/useCreateAppDialog";

const DialogControls = () => {
  const { isOpen, open, close } = useCreateAppDialog();

  return (
    <>
      <output>{isOpen ? "open" : "closed"}</output>
      <button type="button" onClick={open}>
        Open create app dialog
      </button>
      <button type="button" onClick={close}>
        Dismiss create app dialog
      </button>
    </>
  );
};

const renderDialog = () => {
  const store = createStore();

  render(
    <Provider store={store}>
      <DialogControls />
      <CreateAppDialog />
    </Provider>,
  );
};

// #region Atom-backed dialog state
describe("CreateAppDialog [atom state]", () => {
  it("opens and closes through the shared hook without changing the URL", () => {
    window.history.replaceState({}, "", "/teams/team_1/apps?tab=members");
    const initialUrl = window.location.href;

    renderDialog();
    expect(screen.getByText("closed")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Create a new app" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Open create app dialog" }),
    );

    expect(screen.getByText("open")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Create a new app" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("App name")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Close create app dialog" }),
    );

    expect(screen.getByText("closed")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Create a new app" }),
    ).not.toBeInTheDocument();
    expect(window.location.href).toBe(initialUrl);
  });

  it("resets form state after dismissal before reopening", () => {
    renderDialog();
    fireEvent.click(
      screen.getByRole("button", { name: "Open create app dialog" }),
    );

    fireEvent.change(screen.getByLabelText("App name"), {
      target: { value: "Draft app" },
    });
    expect(screen.getByLabelText("App name")).toHaveValue("Draft app");

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss create app dialog" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Open create app dialog" }),
    );

    expect(screen.getByLabelText("App name")).toHaveValue("");
  });
});
// #endregion
