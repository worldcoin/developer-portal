/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Loading real utils.ts pulls in idkit/ox, which needs TextEncoder (absent in
// jsdom) — mock just what this page tree uses.
jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
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

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/graphql/client/create-editable-row.generated",
  () => ({
    useCreateEditableRowMutation: () => [jest.fn()],
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
import { unverifiedImageAtom } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout/ImagesProvider";

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

  it("renders the app icon box and all four numbered sections with bodies exposed, plus the danger zone", () => {
    renderPage();
    // Standalone app icon box (extracted from Basic information).
    expect(screen.getByText(/App icon/)).toBeInTheDocument();
    for (const [number, title] of [
      ["01", "Basic information"],
      ["02", "Store listing"],
      ["03", "Availability"],
      ["04", "Localized content"],
    ]) {
      // Once in the section header badge, once in the jump nav badge.
      expect(screen.getAllByText(number)).toHaveLength(2);
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    // Jump nav lists the same sections (registered by the sections
    // themselves on mount).
    const toc = screen.getByRole("navigation", { name: "Page sections" });
    expect(
      within(toc).getByRole("button", { name: /Store listing/ }),
    ).toBeInTheDocument();
    // Bodies are always exposed (no dropdowns): a field from each section.
    expect(screen.getByLabelText(/App name/)).toBeInTheDocument();
    expect(
      screen.getByText(/Laws and regulations governing mini apps/),
    ).toBeInTheDocument();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete app" }),
    ).toBeInTheDocument();
  });
});
// #endregion

// #region Right rail
describe("v3 Configuration redesign [right rail]", () => {
  it("shows an always-active submit button (validation responds on click instead of a gate)", () => {
    renderPage();

    const submitButton = screen.getByRole("button", {
      name: /Submit for review/,
    });
    expect(submitButton).toBeEnabled();
  });

  it("renders the listing preview fed by form values and static placeholders", () => {
    renderPage();
    expect(screen.getByText("Live preview")).toBeInTheDocument();
    // Live values: name from basic info, publisher, platform from app_mode.
    expect(screen.getAllByText("na").length).toBeGreaterThan(0);
    expect(screen.getByText("sampleteam")).toBeInTheDocument();
    // Scoped to the rail: "Mini App" also appears as an app-mode radio label.
    const rail = screen.getByRole("complementary");
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
    expect(screen.getByText("Draft saved")).toBeInTheDocument();
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
    // Sections renumber: Availability 02, Localized content 03, no 04
    // (each number renders in the header badge and the jump nav badge).
    expect(screen.getAllByText("02")).toHaveLength(2);
    expect(screen.getAllByText("03")).toHaveLength(2);
    expect(screen.queryAllByText("04")).toHaveLength(0);
    // The jump nav follows the registry: no Store listing entry either.
    const toc = screen.getByRole("navigation", { name: "Page sections" });
    expect(
      within(toc).queryByRole("button", { name: /Store listing/ }),
    ).not.toBeInTheDocument();
    expect(
      within(toc).getByRole("button", { name: /Availability/ }),
    ).toBeInTheDocument();
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
    // The rail's submit button is gone for non-editable drafts.
    expect(
      screen.queryByRole("button", { name: /Submit for review/ }),
    ).not.toBeInTheDocument();
  });
});
// #endregion
