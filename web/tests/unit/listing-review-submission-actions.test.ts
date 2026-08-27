import { submitAppForReviewFormServerSide } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/server/submit";
import { removeAppFromReview } from "@/scenes/common/Teams/TeamId/Apps/common/hooks/server";

// #region Mocks
const requestMock = jest.fn();
const getIsUserAllowedToUpdateAppMetadataMock = jest.fn();
const getIsUserAllowedToUpdateVerificationStatusMock = jest.fn();
const getSessionMock = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(async () => ({ request: requestMock })),
}));

jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToUpdateAppMetadata: (...args: unknown[]) =>
    getIsUserAllowedToUpdateAppMetadataMock(...args),
  getIsUserAllowedToUpdateVerificationStatus: (...args: unknown[]) =>
    getIsUserAllowedToUpdateVerificationStatusMock(...args),
}));

jest.mock("@/lib/server-utils", () => ({
  getPathFromHeaders: jest.fn(async () =>
    Promise.resolve(`/teams/${teamId}/apps/${appId}`),
  ),
  extractIdsFromPath: jest.fn(() => ({ Apps: appId, Teams: teamId })),
}));

jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSessionMock(...args) },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/api/helpers/portal-events", () => ({
  logPortalEvent: jest.fn(),
}));
// #endregion

// #region Test Data
const appId = "app_11111111111111111111111111111111";
const teamId = "team_22222222222222222222222222222222";
const metadataId = "meta_33333333333333333333333333333333";

const reviewMetadata = {
  id: metadataId,
  app_id: appId,
  name: "Review App",
  short_name: "Review",
  logo_img_url: "logo_img.png",
  showcase_img_urls: ["showcase_img_1.png"],
  meta_tag_image_url: "meta_tag_image.png",
  world_app_description: "A useful app",
  description: JSON.stringify({
    description_overview: "A complete description for review.",
    description_how_it_works: "",
    description_connect: "",
  }),
  category: "Other",
  integration_url: "https://app.example.com",
  app_website_url: "https://example.com",
  support_link: "mailto:support@example.com",
  supported_countries: ["US"],
  supported_languages: ["en", "es"],
  is_android_only: false,
  is_for_humans_only: false,
  app_mode: "mini-app",
  verification_status: "unverified",
  content_card_image_url: "content_card_image.png",
  updated_at: "2026-08-27T20:00:00.000Z",
  app: {
    id: appId,
    team_id: teamId,
    is_staging: false,
  },
};

const localisations = [
  {
    id: "loc_44444444444444444444444444444444",
    app_metadata_id: metadataId,
    locale: "es",
    name: "Aplicacion",
    short_name: "App",
    world_app_description: "Una app util",
    description: JSON.stringify({
      description_overview: "Una descripcion completa para revision.",
      description_how_it_works: "",
      description_connect: "",
    }),
    meta_tag_image_url: "meta_tag_image.png",
    showcase_img_urls: ["showcase_img_1.png"],
  },
];

const operationName = (query: unknown) =>
  typeof query === "string"
    ? query
    : (query as { definitions?: { name?: { value?: string } }[] })
        .definitions?.[0]?.name?.value ?? "";

const submit = (isDeveloperAllowListing = true) =>
  submitAppForReviewFormServerSide({
    input: {
      app_metadata_id: metadataId,
      team_id: teamId,
      changelog: "Ready for listing review.",
      is_developer_allow_listing: isDeveloperAllowListing,
    },
  });
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "true";
  getIsUserAllowedToUpdateAppMetadataMock.mockResolvedValue(true);
  getIsUserAllowedToUpdateVerificationStatusMock.mockResolvedValue(true);
  getSessionMock.mockResolvedValue({
    user: { sub: "auth0|submitter", email: "submitter@example.com" },
  });
  requestMock.mockImplementation(async (query: unknown, variables: any) => {
    switch (operationName(query)) {
      case "FetchAppMetadataById":
        return { app_metadata: [reviewMetadata], localisations };
      case "CaptureListingReviewSubmission":
        return {
          capture_listing_review_submission: [
            {
              id: "00000000-0000-0000-0000-000000000001",
              app_metadata_id: metadataId,
              attempt: 1,
              status: "pending",
            },
          ],
        };
      case "SubmitApp":
        return {
          update_app_metadata_by_pk: {
            id: variables.app_metadata_id,
            verification_status: variables.verification_status,
            is_developer_allow_listing: variables.is_developer_allow_listing,
          },
        };
      case "WithdrawListingReviewSubmission":
        return {
          withdraw_listing_review_submission: [
            {
              id: "00000000-0000-0000-0000-000000000001",
              status: "withdrawn",
            },
          ],
        };
      case "RemoveAppFromReview":
        return { update_app_metadata_by_pk: { id: metadataId } };
      default:
        throw new Error(`Unexpected operation: ${operationName(query)}`);
    }
  });
});

afterEach(() => {
  delete process.env.ADMIN_REVIEWER_PORTAL_ENABLED;
});

// #region Human submission
describe("human listing review submission", () => {
  it("uses the atomic listing operation with the exact row and human actor", async () => {
    const result = await submit(true);

    expect(result.success).toBe(true);
    const captureCall = requestMock.mock.calls.find(
      ([query]) => operationName(query) === "CaptureListingReviewSubmission",
    );
    expect(captureCall?.[1]).toEqual({
      app_metadata_id: metadataId,
      changelog: "Ready for listing review.",
      submitted_by_subject: "auth0|submitter",
      submitted_by_email: "submitter@example.com",
      listing_consent: true,
      expected_metadata_updated_at: reviewMetadata.updated_at,
      expected_localizations_snapshot: localisations,
    });
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "SubmitApp",
      ),
    ).toBe(false);
  });

  it("rejects a native app before any submission mutation", async () => {
    requestMock.mockImplementationOnce(async () => ({
      app_metadata: [{ ...reviewMetadata, app_mode: "native" }],
      localisations,
    }));

    const result = await submit(true);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/mini app or external integration/i);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an external integration without a valid HTTPS URL", async () => {
    requestMock.mockImplementationOnce(async () => ({
      app_metadata: [
        {
          ...reviewMetadata,
          app_mode: "external",
          integration_url: "http://insecure.example.com",
        },
      ],
      localisations,
    }));

    const result = await submit(true);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/integration url.*https/i);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a missing supported-language row before mutation", async () => {
    requestMock.mockImplementationOnce(async () => ({
      app_metadata: [reviewMetadata],
      localisations: [],
    }));

    const result = await submit(true);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/missing localisation/i);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("keeps verification-only submission on the legacy mutation", async () => {
    const result = await submit(false);

    expect(result.success).toBe(true);
    const legacyCall = requestMock.mock.calls.find(
      ([query]) => operationName(query) === "SubmitApp",
    );
    expect(legacyCall?.[1]).toEqual(
      expect.objectContaining({
        app_metadata_id: metadataId,
        is_developer_allow_listing: false,
        verification_status: "awaiting_review",
      }),
    );
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "CaptureListingReviewSubmission",
      ),
    ).toBe(false);
  });

  it("keeps consent-free native verification on the legacy path", async () => {
    requestMock.mockImplementationOnce(async () => ({
      app_metadata: [{ ...reviewMetadata, app_mode: "native" }],
      localisations,
    }));

    const result = await submit(false);

    expect(result.success).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "SubmitApp",
      ),
    ).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "CaptureListingReviewSubmission",
      ),
    ).toBe(false);
  });

  it("keeps gate-off native listing consent on the legacy path", async () => {
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "false";
    requestMock.mockImplementationOnce(async () => ({
      app_metadata: [{ ...reviewMetadata, app_mode: "native" }],
      localisations,
    }));

    const result = await submit(true);

    expect(result.success).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "SubmitApp",
      ),
    ).toBe(true);
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "CaptureListingReviewSubmission",
      ),
    ).toBe(false);
  });
});
// #endregion

// #region Withdrawal
describe("listing review withdrawal", () => {
  it("withdraws the exact active attempt atomically when the gate is enabled", async () => {
    const result = await removeAppFromReview(metadataId);

    expect(result.success).toBe(true);
    const withdrawCall = requestMock.mock.calls.find(
      ([query]) => operationName(query) === "WithdrawListingReviewSubmission",
    );
    expect(withdrawCall?.[1]).toEqual({
      app_metadata_id: metadataId,
      actor_subject: "auth0|submitter",
      actor_email: "submitter@example.com",
    });
    expect(
      requestMock.mock.calls.some(
        ([query]) => operationName(query) === "RemoveAppFromReview",
      ),
    ).toBe(false);
  });
});
// #endregion
