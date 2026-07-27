/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { CreateKeyModal } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/CreateKeyModal";

// #region Mocks
// The only path that reaches ApiKeySecretFields in production: card -> modal ->
// success screen. File 6 stubs this modal, so the endpoint bug is invisible there.
jest.mock(
  "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/CreateKeyModal/graphql/client/create-key.generated",
  () => ({ InsertKeyDocument: { __doc: "insert" } }),
);
jest.mock(
  "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/ApiKeyTable/ApiKeyRow/graphql/client/reset-api-key.generated",
  () => ({ ResetApiKeyDocument: { __doc: "reset" } }),
);
jest.mock(
  "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated",
  () => ({ FetchKeysDocument: { __doc: "fetch" } }),
);

jest.mock("@apollo/client/react", () => ({
  useMutation: (document: { __doc?: string }) => [
    jest.fn(async () =>
      document?.__doc === "insert"
        ? { data: { insert_api_key_one: { id: "key_1" } } }
        : { data: { reset_api_key: { api_key: "api_TESTSECRET" } } },
    ),
    { loading: false },
  ],
}));

// Headless UI portal/transition machinery is not the subject.
jest.mock("@/components/Dialog", () => ({
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock("@/components/DialogOverlay", () => ({
  DialogOverlay: () => null,
}));
jest.mock("@/components/DialogPanel", () => ({
  DialogPanel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
// #endregion

const originalLocation = window.location;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window, "location", {
    value: new URL("https://staging.developer.world.org/teams/team_1/settings"),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: jest.fn() },
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

// #region Seam
describe("CreateKeyModal -> ApiKeySecretFields", () => {
  it("shows an origin-correct MCP command on the success screen", async () => {
    const { container } = render(
      <CreateKeyModal teamId="team_1" isOpen setIsOpen={jest.fn()} />,
    );

    // Input renders `label` as a bare <legend>, so query by placeholder.
    fireEvent.change(screen.getByPlaceholderText("api_key_123"), {
      target: { value: "mcp" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() =>
      expect(container.querySelector("pre")).toBeInTheDocument(),
    );

    expect(container.querySelector("pre")!.textContent).toContain(
      "https://staging.developer.world.org/api/mcp",
    );
    expect(document.body.textContent).not.toContain(
      "https://developer.world.org/api/mcp",
    );
    expect(document.body.textContent).not.toContain("--scope project");
  });
});
// #endregion
