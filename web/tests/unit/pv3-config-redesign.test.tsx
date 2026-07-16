/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockToastError = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: jest.fn(),
  },
}));

jest.mock("posthog-js", () => ({
  capture: jest.fn(),
}));

// Loading real utils.ts pulls in idkit/ox, which needs TextEncoder (absent in
// jsdom) — mock just what this page tree uses.
const checkUserPermissionsMock = jest.fn((..._args: unknown[]) => true);
jest.mock("@/lib/utils", () => ({
  checkUserPermissions: (...args: unknown[]) =>
    checkUserPermissionsMock(...args),
  getCDNImageUrl: (_appId: string, path: string) => `https://cdn/${path}`,
  getDefaultLogoImgCDNUrl: () => "",
  truncateString: (value?: string) => value ?? "",
}));

const useFetchAppMetadataQuery = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated",
  () => ({
    useFetchAppMetadataQuery: (...args: unknown[]) =>
      useFetchAppMetadataQuery(...args),
    FetchAppMetadataDocument: {},
  }),
);

const useFetchLocalisationsQuery = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated",
  () => ({
    useFetchLocalisationsQuery: (...args: unknown[]) =>
      useFetchLocalisationsQuery(...args),
    FetchLocalisationsDocument: {},
  }),
);

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-images.generated",
  () => ({
    useFetchImagesQuery: () => ({ data: undefined }),
    useFetchImagesLazyQuery: () => [jest.fn()],
  }),
);

const createEditableRowMock = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/graphql/client/create-editable-row.generated",
  () => ({
    useCreateEditableRowMutation: () => [
      (...args: unknown[]) => createEditableRowMock(...args),
    ],
  }),
);

jest.mock("@/lib/use-refetch-queries", () => ({
  useRefetchQueries: () => ({ refetch: jest.fn() }),
}));

jest.mock("@apollo/client", () => ({
  useApolloClient: () => ({
    cache: { modify: jest.fn(), identify: jest.fn() },
    readQuery: () => null,
  }),
}));

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/common/hooks/use-remove-from-review",
  () => ({
    useRemoveFromReview: () => ({
      removeFromReview: jest.fn(),
      loading: false,
    }),
  }),
);

// Server actions (I/O boundary)
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/BasicInformation/server/submit",
  () => ({
    validateAndSubmitServerSide: jest.fn().mockResolvedValue({
      success: true,
    }),
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/MiniAppConfiguration/server/submit",
  () => ({
    updateAppMode: jest.fn().mockResolvedValue({ success: true }),
  }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/server/update-app-store",
  () => ({
    updateAppStoreMetadata: jest.fn().mockResolvedValue({ success: true }),
  }),
);

// Heavy leaf components with their own uploads/mutations — not under test
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/LogoImageUpload",
  () => ({ LogoImageUpload: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/SubmitAppModal",
  () => ({ SubmitAppModal: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/DeleteModal",
  () => ({ DeleteModal: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ContentCardImageUpload",
  () => ({ ContentCardImageUpload: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/ShowcaseImagesField",
  () => ({ ShowcaseImagesField: () => null }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/MetaTagImageField",
  () => ({ MetaTagImageField: () => null }),
);

const teamId = "team_1";
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";

jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId, appId }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({
    user: {
      hasura: {
        memberships: [{ team: { id: teamId }, role: "OWNER" }],
      },
    },
  }),
}));

import { getDefaultStore } from "jotai";
import { AppProfilePage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/page";
import { AppDangerZonePage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/page";
import {
  isMiniAppAtom,
  unverifiedImageAtom,
  viewModeAtom,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout/ImagesProvider";

type UnverifiedImages = {
  logo_img_url?: string;
  showcase_image_urls?: string[] | null;
  meta_tag_image_url?: string;
  content_card_image_url?: string;
};
// #endregion

// #region Test Data
const makeAppMetadata = (overrides: Record<string, unknown> = {}) => ({
  __typename: "app_metadata",
  id: "meta_1",
  app_id: appId,
  name: "na",
  logo_img_url: "",
  hero_image_url: "",
  meta_tag_image_url: "",
  showcase_img_urls: [] as string[],
  description: "",
  world_app_description: "",
  category: "",
  is_developer_allow_listing: false,
  world_app_button_text: "",
  integration_url: "https://youtube.com",
  app_website_url: "",
  source_code_url: "",
  verified_at: null,
  review_message: "",
  verification_status: "unverified",
  app_mode: "mini-app",
  whitelisted_addresses: null,
  support_link: "",
  supported_countries: [] as string[],
  supported_languages: ["en"],
  short_name: "",
  associated_domains: null,
  contracts: null,
  permit2_tokens: null,
  can_import_all_contacts: false,
  can_use_attestation: false,
  is_allowed_unlimited_notifications: false,
  max_notifications_per_day: null,
  is_android_only: false,
  is_for_humans_only: false,
  content_card_image_url: "",
  ...overrides,
});

const makeApp = (metadata: Record<string, unknown>) => ({
  id: appId,
  engine: "cloud",
  is_staging: false,
  status: "active",
  team: { name: "sampleteam" },
  app_metadata: [metadata],
  verified_app_metadata: [] as unknown[],
});

const renderPage = () => render(<AppProfilePage params={{ teamId, appId }} />);
const renderDangerPage = () =>
  render(<AppDangerZonePage params={{ teamId, appId }} />);
const goToStep = (title: string) => {
  while (!screen.queryByRole("heading", { name: title })) {
    fireEvent.click(screen.getByRole("button", { name: /^Continue to / }));
  }
};

// Components read jotai's default store (no Provider), so tests can seed the
// images atom the same way LogoImageUpload / ImagesProvider write it.
const setImages = (images: Partial<UnverifiedImages>) => {
  getDefaultStore().set(unverifiedImageAtom, {
    logo_img_url: "",
    showcase_image_urls: null,
    meta_tag_image_url: "",
    content_card_image_url: "",
    ...images,
  });
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  checkUserPermissionsMock.mockReturnValue(true);
  getDefaultStore().set(viewModeAtom, "unverified");
  getDefaultStore().set(isMiniAppAtom, false);
  setImages({});
  useFetchAppMetadataQuery.mockReturnValue({
    data: { app: [makeApp(makeAppMetadata())] },
    loading: false,
    error: undefined,
  });
  useFetchLocalisationsQuery.mockReturnValue({
    data: { localisations: [] },
    loading: false,
  });
});

// #region Configuration redesign layout
describe("v3 Configuration redesign [layout]", () => {
  it("renders the app-mode radio cards with mini-app selected", () => {
    renderPage();
    expect(
      screen.getByText("How does this app reach users?"),
    ).toBeInTheDocument();
    const miniAppRadio = screen.getByRole("radio", { name: "Mini App" });
    const externalRadio = screen.getByRole("radio", {
      name: "External Integration",
    });
    expect(miniAppRadio).toBeChecked();
    expect(externalRadio).not.toBeChecked();
  });

  it("renders the standard progress bar with a dynamic step fraction", () => {
    renderPage();

    expect(screen.getByText(/App icon/)).toBeInTheDocument();
    const progress = screen.getByRole("progressbar", {
      name: "Configuration progress",
    });
    expect(progress).toHaveAttribute("aria-valuenow", "1");
    expect(progress).toHaveAttribute("aria-valuemax", "4");
    expect(screen.getByText("1/4")).toHaveAccessibleName("Step 1 of 4");
    expect(progress.parentElement).not.toHaveClass("border-t");

    const basicHeading = screen.getByRole("heading", {
      name: "Basic information",
    });
    expect(basicHeading).toBeVisible();
    expect(
      progress.compareDocumentPosition(basicHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Store listing" }),
    ).not.toBeInTheDocument();

    goToStep("Store listing");
    expect(progress).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByText("2/4")).toHaveAccessibleName("Step 2 of 4");
    expect(
      screen.getByRole("heading", { name: "Store listing" }),
    ).toBeVisible();

    goToStep("Availability");
    expect(
      screen.getByText(/Laws and regulations governing mini apps/),
    ).toBeVisible();
    // Danger zone lives in the shell sidebar, not the step footer.
    expect(
      screen.queryByRole("link", { name: "Danger zone" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete app" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// #region Right rail
describe("v3 Configuration redesign [right rail]", () => {
  it("floors step navigation and submit without a boxed bar", () => {
    renderPage();

    // No boxed action shelf — navigation and actions sit bare at the floor.
    expect(
      screen.queryByRole("region", { name: "Configuration actions" }),
    ).not.toBeInTheDocument();
    const backButton = screen.getByRole("button", { name: "Back" });
    const continueButton = screen.getByRole("button", {
      name: "Continue to Store listing",
    });
    expect(backButton).toBeDisabled();
    expect(backButton).toHaveClass("h-10", "min-w-36", "rounded-lg", "px-5");
    expect(continueButton).toHaveClass(
      "h-10",
      "min-w-36",
      "rounded-lg",
      "px-5",
    );
    expect(screen.queryByText(/Draft saved/)).not.toBeInTheDocument();

    // Submit appears only on the final chapter; Continue drives the rest.
    expect(
      screen.queryByRole("button", { name: /Submit for review/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(continueButton);
    expect(
      screen.getByRole("heading", { name: "Store listing" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();

    goToStep("Localized content");
    const submitButton = screen.getByRole("button", {
      name: /Submit for review/,
    });
    expect(submitButton).toBeEnabled();
    expect(submitButton).toHaveClass(
      "h-10",
      "min-w-36",
      "rounded-lg",
      "px-5",
      "bg-grey-900",
    );
    expect(
      within(
        screen.getByRole("complementary", { name: "Live preview" }),
      ).queryByRole("button", { name: /Submit for review/ }),
    ).not.toBeInTheDocument();
  });

  it("renders the listing preview fed by form values and static placeholders", () => {
    renderPage();
    // Live values: name from basic info, publisher, platform from app_mode.
    expect(screen.getAllByText("na").length).toBeGreaterThan(0);
    expect(screen.getByText("sampleteam")).toBeInTheDocument();
    // Scoped to the rail: "Mini App" also appears as an app-mode radio label.
    const rail = screen.getByRole("complementary", { name: "Live preview" });
    expect(within(rail).getByText("Mini App")).toBeInTheDocument();
    // Static placeholders for the non-editable listing bits.
    expect(screen.getByText("Not yet rated")).toBeInTheDocument();
    expect(screen.getByText("Available at launch")).toBeInTheDocument();
    expect(screen.getByText("Open Mini App ↗")).toBeInTheDocument();
    // Empty-field placeholders.
    expect(
      screen.getByText("A one-line summary of your app"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your description appears here/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Showcase image")).toHaveLength(2);
    expect(within(rail).queryByText("Draft saved")).not.toBeInTheDocument();
  });

  it("shows uploaded logo and showcase images in the preview and icon box", () => {
    // Simulates what LogoImageUpload / the unverified_images refetch write
    // into the atom after an upload.
    setImages({
      logo_img_url: "https://cdn.example/unverified/logo.png",
      showcase_image_urls: ["https://cdn.example/unverified/showcase_1.png"],
    });
    renderPage();

    expect(screen.getByAltText("App logo preview")).toHaveAttribute(
      "src",
      "https://cdn.example/unverified/logo.png",
    );
    expect(screen.getByAltText("App icon")).toHaveAttribute(
      "src",
      "https://cdn.example/unverified/logo.png",
    );
    expect(screen.getByAltText("Showcase preview")).toHaveAttribute(
      "src",
      "https://cdn.example/unverified/showcase_1.png",
    );
    // Second showcase slot is still empty.
    expect(screen.getAllByText("Showcase image")).toHaveLength(1);
  });

  it("drops the Store listing section and renumbers for external apps", () => {
    useFetchAppMetadataQuery.mockReturnValue({
      data: { app: [makeApp(makeAppMetadata({ app_mode: "external" }))] },
      loading: false,
      error: undefined,
    });
    renderPage();

    expect(screen.queryByText("Store listing")).not.toBeInTheDocument();
    // Sections renumber and the progress total follows the three-step flow.
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.queryByText("04")).not.toBeInTheDocument();
    expect(screen.getByText("1/3")).toHaveAccessibleName("Step 1 of 3");
    const progress = screen.getByRole("progressbar", {
      name: "Configuration progress",
    });
    expect(progress).toHaveAttribute("aria-valuenow", "1");
    expect(progress).toHaveAttribute("aria-valuemax", "3");
  });

  it("shows the locked-state banner with un-submit while awaiting review", () => {
    useFetchAppMetadataQuery.mockReturnValue({
      data: {
        app: [
          makeApp(makeAppMetadata({ verification_status: "awaiting_review" })),
        ],
      },
      loading: false,
      error: undefined,
    });
    renderPage();

    expect(
      screen.getByText(/In review — editing is locked/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Un-submit" }),
    ).toBeInTheDocument();
    // No bottom bar in read-only states — the header is the only surface.
    expect(
      screen.queryByRole("region", { name: "Configuration actions" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Submit for review/ }),
    ).not.toBeInTheDocument();
  });

  it("normalizes a stale verified view mode back to draft metadata", async () => {
    getDefaultStore().set(viewModeAtom, "verified");
    useFetchAppMetadataQuery.mockReturnValue({
      data: {
        app: [
          makeApp(
            makeAppMetadata({
              name: "Draft App",
              app_website_url: "https://example.com",
            }),
          ),
        ],
      },
      loading: false,
      error: undefined,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/App name/)).toHaveValue("Draft App");
    });
    goToStep("Localized content");
    expect(
      screen.getByRole("button", { name: /Submit for review/ }),
    ).toBeEnabled();
  });

  it("renders a verified-only app read-only with only the corner switch", () => {
    const verifiedMetadata = makeAppMetadata({
      id: "meta_verified",
      name: "Verified App",
      logo_img_url: "logo_img.png",
      verification_status: "verified",
      app_website_url: "https://example.com",
    });

    useFetchAppMetadataQuery.mockReturnValue({
      data: {
        app: [
          {
            ...makeApp(verifiedMetadata),
            app_metadata: [],
            verified_app_metadata: [verifiedMetadata],
          },
        ],
      },
      loading: false,
      error: undefined,
    });

    renderPage();

    // No status strip — the only version trace is the corner switch.
    expect(screen.queryByText("Verified version")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open draft" })).toBeEnabled();
    expect(screen.getByAltText("App icon")).toHaveAttribute(
      "src",
      "https://cdn/logo_img.png",
    );
    expect(screen.getByAltText("App logo preview")).toHaveAttribute(
      "src",
      "https://cdn/logo_img.png",
    );
    expect(screen.getByLabelText(/App name/)).toBeDisabled();
    expect(screen.queryByText("Draft saved")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Submit for review/ }),
    ).not.toBeInTheDocument();
  });

  it("creates the single allowed draft from the corner switch", async () => {
    createEditableRowMock.mockResolvedValue({
      data: { create_new_draft: { success: true } },
    });
    const verifiedMetadata = makeAppMetadata({
      id: "meta_verified",
      name: "Verified App",
      verification_status: "verified",
      app_website_url: "https://example.com",
    });

    useFetchAppMetadataQuery.mockReturnValue({
      data: {
        app: [
          {
            ...makeApp(verifiedMetadata),
            app_metadata: [],
            verified_app_metadata: [verifiedMetadata],
          },
        ],
      },
      loading: false,
      error: undefined,
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Open draft" }));

    await waitFor(() =>
      expect(createEditableRowMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { app_id: appId, team_id: teamId },
        }),
      ),
    );
  });

  it("hides draft creation from members without draft permissions", () => {
    checkUserPermissionsMock.mockReturnValue(false);
    const verifiedMetadata = makeAppMetadata({
      id: "meta_verified",
      name: "Verified App",
      verification_status: "verified",
      app_website_url: "https://example.com",
    });

    useFetchAppMetadataQuery.mockReturnValue({
      data: {
        app: [
          {
            ...makeApp(verifiedMetadata),
            app_metadata: [],
            verified_app_metadata: [verifiedMetadata],
          },
        ],
      },
      loading: false,
      error: undefined,
    });

    renderPage();

    // The create action is Owner/Admin only — a member's click could only
    // fail server-side, so the corner switch doesn't render at all.
    expect(screen.getByLabelText(/App name/)).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Open draft" }),
    ).not.toBeInTheDocument();
    expect(createEditableRowMock).not.toHaveBeenCalled();
  });

  it("switches between the draft and the verified version without creating rows", async () => {
    const draftMetadata = makeAppMetadata({
      id: "meta_draft",
      name: "Draft App",
      app_website_url: "https://example.com",
    });
    const verifiedMetadata = makeAppMetadata({
      id: "meta_verified",
      name: "Verified App",
      verification_status: "verified",
      app_website_url: "https://example.com",
    });

    useFetchAppMetadataQuery.mockReturnValue({
      data: {
        app: [
          {
            ...makeApp(draftMetadata),
            verified_app_metadata: [verifiedMetadata],
          },
        ],
      },
      loading: false,
      error: undefined,
    });

    renderPage();

    // Draft view keeps the corner way back to the approved copy without a
    // persistent save-status indicator.
    expect(screen.queryByText(/Draft saved/)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /View verified version/ }),
    );
    await screen.findByRole("button", { name: "Open draft" });
    expect(screen.queryByText("Draft saved")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open draft" }));
    await screen.findByRole("button", { name: /View verified version/ });
    expect(screen.queryByText(/Draft saved/)).not.toBeInTheDocument();
    expect(createEditableRowMock).not.toHaveBeenCalled();
  });

  it("stops submit without a logo and marks the app icon box", async () => {
    useFetchAppMetadataQuery.mockReturnValue({
      data: {
        app: [
          makeApp(
            makeAppMetadata({
              app_website_url: "https://example.com",
              logo_img_url: "",
            }),
          ),
        ],
      },
      loading: false,
      error: undefined,
    });

    renderPage();

    goToStep("Localized content");
    fireEvent.click(screen.getByRole("button", { name: /Submit for review/ }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Upload an app icon before submitting for review",
      );
    });
    expect(
      screen.getByText("Upload an app icon before submitting for review"),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Basic information" }),
    ).toBeVisible();
  });
});
// #endregion

// #region Danger zone destination
describe("v3 Configuration redesign [danger zone]", () => {
  it("keeps destructive settings on a dedicated page with a path back", () => {
    renderDangerPage();

    expect(
      screen.getByRole("heading", { name: "Danger zone" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to configuration" }),
    ).toHaveAttribute("href", `/teams/${teamId}/apps/${appId}/configuration`);
    expect(screen.getByText(/Permanently delete/)).toHaveTextContent("na");
    expect(
      screen.getByRole("button", { name: "Delete app" }),
    ).toBeInTheDocument();
  });
});
// #endregion
