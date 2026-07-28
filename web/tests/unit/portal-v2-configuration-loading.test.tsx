/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { NetworkStatus } from "@apollo/client";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const metadataQueryMock = jest.fn();
const localisationsQueryMock = jest.fn();

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: jest.fn(),
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: undefined }),
}));

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated",
  () => ({
    FetchAppMetadataDocument: { __mockDoc: "appMetadata" },
  }),
);

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated",
  () => ({
    FetchLocalisationsDocument: { __mockDoc: "localisations" },
  }),
);

jest.mock("@apollo/client/react", () => ({
  useQuery: (
    document: { __mockDoc?: string },
    options: Record<string, unknown>,
  ) =>
    document.__mockDoc === "appMetadata"
      ? metadataQueryMock(options)
      : localisationsQueryMock(options),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({}),
}));

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppTopBar",
  () => ({ AppTopBar: () => null }),
);

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStore/app-store",
  () => ({ AppStoreForm: () => null }),
);

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStore/app-store-form-provider",
  () => ({ AppStoreFormProvider: () => null }),
);

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/BasicInformation",
  () => ({ BasicInformation: () => null }),
);

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/MiniAppConfiguration",
  () => ({ MiniAppConfiguration: () => null }),
);

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/RejectionBanner",
  () => ({ RejectionBanner: () => null }),
);

jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/ResolveModal",
  () => ({ ResolveModal: () => null }),
);

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/common/hooks/use-remove-from-review",
  () => ({
    useRemoveFromReview: () => ({ removeFromReview: jest.fn() }),
  }),
);

import { AppProfilePage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/page";
// #endregion

// #region Test Data
const appId = "app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const teamId = "team_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  metadataQueryMock.mockReturnValue({
    data: {
      app: [
        {
          team: { name: "Test team" },
          app_metadata: [
            {
              id: "meta_draft",
              verification_status: "unverified",
            },
          ],
          verified_app_metadata: [
            {
              id: "meta_verified",
              verification_status: "verified",
            },
          ],
        },
      ],
    },
    loading: false,
    error: undefined,
  });
});

// #region Localisation row transitions
describe("v2 Configuration [localisation loading]", () => {
  it("does not mount the form with retained localisations from the previous metadata row", () => {
    localisationsQueryMock.mockReturnValue({
      data: {
        localisations: [{ locale: "fr", name: "Previous version" }],
      },
      loading: true,
      networkStatus: NetworkStatus.setVariables,
    });

    render(<AppProfilePage params={{ appId, teamId }} />);

    expect(screen.queryByText("How does this app reach users?")).toBeNull();
    expect(document.querySelector(".react-loading-skeleton")).not.toBeNull();
  });
});
// #endregion
