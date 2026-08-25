/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { email: "dev@example.com" } }),
}));

jest.mock("posthog-js", () => ({ capture: jest.fn() }));

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
}));

jest.mock("react-qr-code", () => ({
  __esModule: true,
  default: () => <div data-testid="qr-code" />,
}));

jest.mock("@/scenes/PortalV3/common/Icon", () => ({
  Icon: () => null,
}));

jest.mock("@/components/Dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
}));

jest.mock("@/components/DialogOverlay", () => ({
  DialogOverlay: () => null,
}));

jest.mock("@/components/DialogPanel", () => ({
  DialogPanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/DecoratedButton", () => ({
  DecoratedButton: ({
    children,
    loading: _loading,
    ...props
  }: {
    children: React.ReactNode;
    loading?: boolean;
  }) => <button {...props}>{children}</button>,
}));

import { SandboxButton } from "@/scenes/PortalV3/layout/Shell/SandboxButton";
// #endregion

// #region Test Data
const TEAM_ID = "team_1234567890abcdef1234567890abcdef";

const mockLookup = (request: unknown) => {
  global.fetch = jest
    .fn()
    .mockImplementation(async (input: RequestInfo | URL) => ({
      ok: true,
      json: async () => ({
        success: true,
        request:
          String(input) === "/api/v2/sandbox-access-request-ios"
            ? null
            : request,
      }),
    })) as unknown as typeof fetch;
};

const mockIosLookup = (request: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, request }),
  }) as unknown as typeof fetch;
};

const openIosSection = () => {
  render(<SandboxButton teamId={TEAM_ID} />);
  fireEvent.click(screen.getByRole("button", { name: /World ID Sandbox/ }));
};

const openAndroidSection = () => {
  render(<SandboxButton />);
  fireEvent.click(screen.getByRole("button", { name: /World ID Sandbox/ }));
  fireEvent.click(screen.getByRole("button", { name: "Android" }));
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Persistent request confirmation
describe("SandboxButton [android request confirmation]", () => {
  it("keeps the submitted email visible in the persistent pending state", async () => {
    mockLookup({
      email: "tester@gmail.com",
      accepted: false,
      createdAt: "2026-07-23T00:00:00Z",
    });

    openAndroidSection();

    expect(
      await screen.findByText(/We'll email you when the invite has been sent/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Google account email" }),
    ).toHaveValue("tester@gmail.com");
    expect(
      screen.getByRole("textbox", { name: "Google account email" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Request submitted" }),
    ).toBeDisabled();
    expect(global.fetch).toHaveBeenCalledWith("/api/v2/sandbox-access-request");
  });

  it("shows invite-sent copy once the backend accepts the request", async () => {
    mockLookup({
      email: "tester@gmail.com",
      accepted: true,
      createdAt: "2026-07-23T00:00:00Z",
    });

    openAndroidSection();

    expect(
      await screen.findByText(/An invite has been sent to tester@gmail.com/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite sent" })).toBeDisabled();
  });

  it("offers an editable prefilled request form when no request exists", async () => {
    mockLookup(null);

    openAndroidSection();

    const button = await screen.findByRole("button", {
      name: "Request invite",
    });
    await waitFor(() => expect(button).toBeEnabled());
    expect(
      screen.getByRole("textbox", { name: "Google account email" }),
    ).toHaveValue("dev@example.com");
  });

  it("switches to the stored submitted state after a successful request", async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(
        async (input: RequestInfo | URL, init?: RequestInit) => ({
          ok: true,
          json: async () => ({
            success: true,
            request:
              String(input) === "/api/v2/sandbox-access-request-ios" ||
              init?.method !== "POST"
                ? null
                : {
                    email: "dev@example.com",
                    accepted: false,
                    createdAt: "2026-07-23T00:00:00Z",
                  },
          }),
        }),
      ) as unknown as typeof fetch;

    openAndroidSection();

    const button = await screen.findByRole("button", {
      name: "Request invite",
    });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(
      await screen.findByRole("button", { name: "Request submitted" }),
    ).toBeDisabled();
    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/v2/sandbox-access-request",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@example.com" }),
      },
    );
  });
});
// #endregion

// #region iOS enrollment request
describe("SandboxButton [iOS enrollment request]", () => {
  it("shows the email form and public TestFlight install link", async () => {
    mockIosLookup(null);

    openIosSection();

    const submitButton = await screen.findByRole("button", {
      name: "Submit email",
    });
    await waitFor(() => expect(submitButton).toBeEnabled());
    expect(
      screen.getByRole("textbox", { name: "Apple Account email" }),
    ).toHaveValue("dev@example.com");
    expect(screen.getByRole("link", { name: "TestFlight" })).toHaveAttribute(
      "href",
      "https://apps.apple.com/us/app/testflight/id899247664",
    );
    expect(screen.getByRole("link", { name: "TestFlight" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(
      screen.getByText("Submit your Apple Account email for enrollment."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/World ID Sandbox will then appear in TestFlight/),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("qr-code")).not.toBeInTheDocument();
  });

  it("keeps a pending ASC email visible and immutable", async () => {
    mockIosLookup({
      ascEmail: "apple@example.com",
      status: "pending",
    });

    openIosSection();

    expect(
      await screen.findByText(
        /enrollment request for apple@example.com is pending/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Apple Account email" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Request submitted" }),
    ).toBeDisabled();
  });

  it("shows approved state from the status enum", async () => {
    mockIosLookup({
      ascEmail: "apple@example.com",
      status: "approved",
    });

    openIosSection();

    expect(
      await screen.findByText(/was approved. Check TestFlight/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approved" })).toBeDisabled();
  });

  it("lets a rejected user edit the email and request again", async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(
        async (_input: RequestInfo | URL, init?: RequestInit) => ({
          ok: true,
          json: async () => ({
            success: true,
            request:
              init?.method === "POST"
                ? { ascEmail: "second@example.com", status: "pending" }
                : { ascEmail: "apple@example.com", status: "rejected" },
          }),
        }),
      ) as unknown as typeof fetch;

    openIosSection();

    expect(
      await screen.findByText(/was rejected. You can update the email/),
    ).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Apple Account email" });
    const resubmitButton = screen.getByRole("button", {
      name: "Request again",
    });
    expect(input).toBeEnabled();
    await waitFor(() => expect(resubmitButton).toBeEnabled());

    fireEvent.change(input, { target: { value: "second@example.com" } });
    fireEvent.click(resubmitButton);

    expect(
      await screen.findByText(
        /enrollment request for second@example.com is pending/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request submitted" }),
    ).toBeDisabled();
    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/v2/sandbox-access-request-ios",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asc_email: "second@example.com",
          team_id: TEAM_ID,
        }),
      },
    );
  });

  it("shows revoked TestFlight access separately from rejection", async () => {
    mockIosLookup({
      ascEmail: "apple@example.com",
      status: "revoked",
    });

    openIosSection();

    expect(
      await screen.findByText(/TestFlight access.*was revoked/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Access revoked" }),
    ).toBeDisabled();
  });

  it("submits asc_email and switches to the stored state", async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(
        async (_input: RequestInfo | URL, init?: RequestInit) => ({
          ok: true,
          json: async () => ({
            success: true,
            request:
              init?.method === "POST"
                ? {
                    ascEmail: "apple@example.com",
                    status: "pending",
                  }
                : null,
          }),
        }),
      ) as unknown as typeof fetch;

    openIosSection();

    const input = screen.getByRole("textbox", { name: "Apple Account email" });
    const submitButton = await screen.findByRole("button", {
      name: "Submit email",
    });
    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.change(input, { target: { value: "apple@example.com" } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByRole("button", { name: "Request submitted" }),
    ).toBeDisabled();
    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/v2/sandbox-access-request-ios",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asc_email: "apple@example.com",
          team_id: TEAM_ID,
        }),
      },
    );
  });
});
// #endregion
