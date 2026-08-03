/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

const useAutosaveWithStatus = jest.fn();
const validateAndSubmitServerSide = jest.fn();
const createNewDraft = jest.fn();
const cacheModify = jest.fn();

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: {} }),
}));

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
  cn: (...inputs: Array<string | undefined | false>) =>
    inputs.filter(Boolean).join(" "),
}));

jest.mock("@apollo/client/react", () => ({
  useApolloClient: () => ({
    cache: {
      identify: () => "app_metadata:meta_draft",
      modify: (...args: unknown[]) => cacheModify(...args),
    },
  }),
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-autosave-with-status",
  () => ({
    useAutosaveWithStatus: (...args: unknown[]) =>
      useAutosaveWithStatus(...args),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-create-new-draft",
  () => ({
    useCreateNewDraft: () => ({ createNewDraft, isCreating: false }),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/BasicInformation/server/submit",
  () => ({
    validateAndSubmitServerSide: (...args: unknown[]) =>
      validateAndSubmitServerSide(...args),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/SaveStatus",
  () => ({
    SaveStatusIndicator: () => <span>Saved</span>,
    SaveStatusProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  }),
);

jest.mock("qrcode", () => ({
  __esModule: true,
  default: {
    toDataURL: jest.fn().mockResolvedValue("data:image/png;base64,qr"),
  },
}));

jest.mock("@/components/CopyButton", () => ({
  CopyButton: ({ fieldValue }: { fieldValue: string }) => (
    <span data-testid="preview-link">{fieldValue}</span>
  ),
}));

import { DevelopContent } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Develop/page";

const appId = "app_1234567890abcdef1234567890abcdef" as const;
const teamId = "team_1234567890abcdef1234567890abcdef" as const;

const metadata = (overrides: Record<string, unknown> = {}) => ({
  __typename: "app_metadata",
  id: "meta_draft",
  app_id: appId,
  name: "Demo",
  integration_url: "https://draft.example.com",
  verification_status: "unverified",
  app_mode: "mini-app",
  ...overrides,
});

const app = ({
  draft,
  verified,
}: {
  draft?: Record<string, unknown>;
  verified?: Record<string, unknown>;
}) =>
  ({
    id: appId,
    team: { name: "Demo team" },
    app_metadata: draft ? [draft] : [],
    verified_app_metadata: verified ? [verified] : [],
  }) as never;

const renderWithTooltip = (ui: React.ReactElement) =>
  render(<TooltipProvider>{ui}</TooltipProvider>);

beforeEach(() => {
  jest.clearAllMocks();
  validateAndSubmitServerSide.mockResolvedValue({ success: true });
});

describe("Mini App Develop", () => {
  it("edits the draft App URL through the shared basic-information action", async () => {
    renderWithTooltip(
      <DevelopContent
        appId={appId}
        teamId={teamId}
        app={app({ draft: metadata() })}
      />,
    );

    const appUrl = screen.getByRole("textbox", { name: "App URL *" });
    expect(appUrl).toBeEnabled();
    expect(appUrl).toHaveValue("https://draft.example.com");
    expect(
      screen.getByRole("button", { name: "About the App URL" }),
    ).toHaveClass("-translate-y-px");
    const previewLink = screen.getByTestId("preview-link");
    expect(previewLink).toHaveTextContent(`draft_id=meta_draft`);
    expect(previewLink.closest("section")).toHaveClass("w-full");
    expect(previewLink.closest("section")).not.toHaveClass("max-w-[300px]");
    expect(previewLink.parentElement?.parentElement).toHaveClass(
      "w-full",
      "max-w-[300px]",
    );
    await screen.findByAltText("Mini App preview QR code");

    await useAutosaveWithStatus.mock.calls[0][0].save(
      { integration_url: "https://next.example.com" },
      undefined,
    );

    expect(validateAndSubmitServerSide).toHaveBeenCalledWith(
      "meta_draft",
      appId,
      { integration_url: "https://next.example.com" },
    );
    expect(cacheModify).toHaveBeenCalled();
  });

  it("shows a verified-only App URL as locked and creates a draft explicitly", async () => {
    renderWithTooltip(
      <DevelopContent
        appId={appId}
        teamId={teamId}
        app={app({
          verified: metadata({
            id: "meta_verified",
            integration_url: "https://live.example.com",
            verification_status: "verified",
          }),
        })}
      />,
    );

    expect(screen.getByRole("textbox", { name: "App URL *" })).toBeDisabled();
    expect(
      screen.getByText(/This is the verified App URL/),
    ).toBeInTheDocument();
    await screen.findByAltText("Mini App preview QR code");

    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    expect(createNewDraft).toHaveBeenCalledTimes(1);
  });

  it("keeps the URL editable for external integrations without showing a QR", () => {
    renderWithTooltip(
      <DevelopContent
        appId={appId}
        teamId={teamId}
        app={app({ draft: metadata({ app_mode: "external" }) })}
      />,
    );

    expect(screen.getByRole("textbox", { name: "App URL *" })).toBeEnabled();
    expect(
      screen.getByText(/Mini App preview becomes available/),
    ).toBeInTheDocument();
    expect(
      screen.queryByAltText("Mini App preview QR code"),
    ).not.toBeInTheDocument();
  });
});
