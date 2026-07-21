/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  act,
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

// In AC4 the rendered tree calls useQuery/useLazyQuery/useMutation from
// "@apollo/client/react" with a typed Document (FooDocument). The generated
// modules now only need to hand back a distinctly-tagged Document that the
// react-hook mock below routes on; the data jest.fns stay and are configured
// via .mockReturnValue in beforeEach.
const useFetchAppMetadataQuery = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated",
  () => ({
    FetchAppMetadataDocument: { __mockDoc: "appMetadata" },
  }),
);

const useFetchLocalisationsQuery = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated",
  () => ({
    FetchLocalisationsDocument: { __mockDoc: "localisations" },
  }),
);

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-images.generated",
  () => ({
    FetchImagesDocument: { __mockDoc: "images" },
  }),
);

const createEditableRowMock = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/graphql/client/create-editable-row.generated",
  () => ({
    CreateEditableRowDocument: { __mockDoc: "createEditableRow" },
  }),
);

jest.mock("@/lib/use-refetch-queries", () => ({
  useRefetchQueries: () => ({ refetch: jest.fn() }),
}));

// AC4: the react hooks (useQuery/useLazyQuery/useMutation/useApolloClient)
// moved to "@apollo/client/react". Route by the Document's __mockDoc tag.
jest.mock("@apollo/client/react", () => ({
  useQuery: (doc: { __mockDoc?: string } | undefined) => {
    switch (doc?.__mockDoc) {
      case "appMetadata":
        return useFetchAppMetadataQuery();
      case "localisations":
        return useFetchLocalisationsQuery();
      default:
        return {
          data: undefined,
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        };
    }
  },
  useLazyQuery: () => [
    jest.fn(),
    { data: undefined, loading: false, called: false },
  ],
  useMutation: (doc: { __mockDoc?: string } | undefined) => {
    if (doc?.__mockDoc === "createEditableRow") {
      return [
        (...args: unknown[]) => createEditableRowMock(...args),
        { loading: false },
      ];
    }
    return [jest.fn().mockResolvedValue({ data: {} }), { loading: false }];
  },
  useApolloClient: () => ({
    cache: { modify: jest.fn(), identify: jest.fn() },
    readQuery: () => null,
    writeQuery: jest.fn(),
  }),
  skipToken: Symbol.for("apollo.skipToken"),
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
  usePathname: () => `/teams/${teamId}/apps/${appId}/configuration`,
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

const installWebAnimationsMock = () => {
  const animateDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "animate",
  );
  const getAnimationsDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "getAnimations",
  );
  const animations: Array<{
    resolve: () => void;
    reject: (reason?: unknown) => void;
  }> = [];
  const animate = jest.fn(
    (
      _keyframes: Keyframe[] | PropertyIndexedKeyframes,
      _options?: number | KeyframeAnimationOptions,
    ) => {
      let resolve!: () => void;
      let reject!: (reason?: unknown) => void;
      const finished = new Promise<void>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
      });
      animations.push({ resolve, reject });
      return { cancel: jest.fn(), finished } as unknown as Animation;
    },
  );

  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: animate,
  });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", {
    configurable: true,
    value: () => [],
  });

  return {
    animate,
    animations,
    restore: () => {
      if (animateDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          "animate",
          animateDescriptor,
        );
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
      }

      if (getAnimationsDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          "getAnimations",
          getAnimationsDescriptor,
        );
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
      }
    },
  };
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
describe("v3 Configuration redesign [footer and preview]", () => {
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
    expect(backButton).toHaveClass("h-10", "w-44", "rounded-lg", "px-5");
    expect(continueButton).toHaveClass("h-10", "w-44", "rounded-lg", "px-5");
    expect(continueButton).toHaveAttribute("type", "button");
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
    expect(submitButton).toBe(continueButton);
    expect(submitButton).toHaveAttribute("type", "submit");
    expect(submitButton).toHaveClass(
      "h-10",
      "w-44",
      "rounded-lg",
      "px-5",
      "bg-grey-900",
    );
    expect(
      within(submitButton).queryByText("Continue"),
    ).not.toBeInTheDocument();
    expect(
      within(submitButton).getByText("Submit for review"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("complementary", { name: "Live preview" }),
      ).queryByRole("button", { name: /Submit for review/ }),
    ).not.toBeInTheDocument();
  });

  it("swaps the primary label only after the old label fades out", async () => {
    const { animate, animations, restore } = installWebAnimationsMock();

    try {
      renderPage();
      goToStep("Availability");

      const primaryAction = screen.getByRole("button", {
        name: "Continue to Localized content",
      });
      fireEvent.click(primaryAction);

      expect(animate).toHaveBeenCalledTimes(1);
      expect(within(primaryAction).getByText("Continue")).toBeInTheDocument();
      expect(
        within(primaryAction).queryByText("Submit for review"),
      ).not.toBeInTheDocument();

      await act(async () => {
        animations[0]?.resolve();
        await Promise.resolve();
      });

      await waitFor(() =>
        expect(
          within(primaryAction).getByText("Submit for review"),
        ).toBeInTheDocument(),
      );
      await waitFor(() => expect(animate).toHaveBeenCalledTimes(2));

      expect(animate.mock.calls[0]?.[0]).toEqual([
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-2px)" },
      ]);
      expect(animate.mock.calls[1]?.[0]).toEqual([
        { opacity: 0, transform: "translateY(2px)" },
        { opacity: 1, transform: "translateY(0)" },
      ]);

      await act(async () => {
        animations[1]?.resolve();
        await Promise.resolve();
      });
    } finally {
      restore();
    }
  });

  it("keeps the visible label aligned when an animation is interrupted", async () => {
    const { animations, restore } = installWebAnimationsMock();

    try {
      renderPage();
      goToStep("Availability");

      const primaryAction = screen.getByRole("button", {
        name: "Continue to Localized content",
      });
      fireEvent.click(primaryAction);

      await act(async () => {
        animations[0]?.reject(new Error("animation interrupted"));
        await Promise.resolve();
      });

      expect(primaryAction).toHaveAccessibleName("Submit for review");
      expect(
        within(primaryAction).getByText("Submit for review"),
      ).toBeInTheDocument();
      expect(
        within(primaryAction).queryByText("Continue"),
      ).not.toBeInTheDocument();
    } finally {
      restore();
    }
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

  it("renders a verified-only app read-only with only the form switch", () => {
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

    // The header badge is a static indicator, not a control; the version
    // action lives in the footer next to Back.
    const indicator = screen.getByTestId("configuration-version-indicator");
    expect(indicator).toHaveAccessibleName("Verified version");
    expect(within(indicator).queryByRole("button")).toBeNull();
    const progress = screen.getByRole("progressbar", {
      name: "Configuration progress",
    });
    // Indicator sits in the wizard header row above the progress bar.
    expect(progress.parentElement).toContainElement(indicator);

    expect(screen.getByRole("button", { name: /New draft/ })).toBeEnabled();
    expect(screen.getByAltText("App icon")).toHaveAttribute(
      "src",
      "https://cdn/logo_img.png",
    );
    expect(screen.getByAltText("App logo preview")).toHaveAttribute(
      "src",
      "https://cdn/logo_img.png",
    );
    expect(screen.getByLabelText(/App name/)).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /Submit for review/ }),
    ).not.toBeInTheDocument();
  });

  it("creates the single allowed draft from the form switch", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: /New draft/ }));

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
    // fail server-side, so the footer version button doesn't render at all.
    expect(screen.getByLabelText(/App name/)).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /New draft/ }),
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

    // Draft view: static "Draft" indicator top-right, "Verified" switch in
    // the footer between Back and the primary action.
    const indicator = screen.getByTestId("configuration-version-indicator");
    expect(indicator).toHaveAccessibleName("Draft version");

    fireEvent.click(screen.getByRole("button", { name: /Verified/ }));
    const openDraftButton = await screen.findByRole("button", {
      name: /New draft/,
    });
    expect(
      screen.getByTestId("configuration-version-indicator"),
    ).toHaveAccessibleName("Verified version");

    // With a draft already in place, the footer button opens it instead of
    // creating another row.
    fireEvent.click(openDraftButton);
    await screen.findByRole("button", { name: /Verified/ });
    expect(
      screen.getByTestId("configuration-version-indicator"),
    ).toHaveAccessibleName("Draft version");
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
