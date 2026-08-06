import { AppStoreFormValues } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/FormSchema/types";
import {
  buildAppStorePersistedPatch,
  WizardPersistedDraft,
  wizardPersistedDraftReducer,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/persisted-draft";

const makeAppStoreValues = (
  overrides: Partial<AppStoreFormValues> = {},
): AppStoreFormValues => ({
  category: "Utilities",
  support_type: "email",
  support_email: "support@example.com",
  support_link: "",
  is_android_only: false,
  is_for_humans_only: false,
  supported_countries: ["US"],
  supported_languages: ["en"],
  localisations: [
    {
      language: "en",
      name: "Current persisted name",
      short_name: "Current",
      world_app_description: "Current tag line",
      description_overview: "Current overview",
      meta_tag_image_url: "",
      showcase_img_urls: ["showcase.png"],
    },
  ],
  ...overrides,
});

const makePersistedDraft = (): WizardPersistedDraft => ({
  basicInformation: {
    name: "Current persisted name",
    integration_url: "https://example.com/app",
    app_website_url: "https://example.com",
  },
  appStore: makeAppStoreValues(),
});

describe("wizard persisted draft", () => {
  it("does not publish an untouched stale English mirror field", () => {
    const staleFormValues = makeAppStoreValues({
      localisations: [
        {
          ...makeAppStoreValues().localisations[0],
          name: "Obsolete RHF name",
          description_overview: "Newly saved overview",
        },
      ],
    });
    const patch = buildAppStorePersistedPatch(staleFormValues, [
      { description_overview: true },
    ]);

    expect(patch.localisations[0]).toEqual({
      language: "en",
      description_overview: "Newly saved overview",
    });

    const next = wizardPersistedDraftReducer(makePersistedDraft(), {
      type: "app-store-saved",
      patch,
    });

    expect(next.appStore.localisations[0]).toEqual(
      expect.objectContaining({
        name: "Current persisted name",
        description_overview: "Newly saved overview",
      }),
    );
    expect(next.basicInformation.name).toBe("Current persisted name");
  });

  it("keeps the canonical name consistent regardless of which save owns it", () => {
    const basicSaved = wizardPersistedDraftReducer(makePersistedDraft(), {
      type: "basic-information-saved",
      patch: { name: "Saved from basic information" },
    });

    expect(basicSaved.basicInformation.name).toBe(
      "Saved from basic information",
    );
    expect(basicSaved.appStore.localisations[0].name).toBe(
      "Saved from basic information",
    );

    const appStorePatch = buildAppStorePersistedPatch(
      makeAppStoreValues({
        localisations: [
          {
            ...makeAppStoreValues().localisations[0],
            name: "Saved from localised content",
          },
        ],
      }),
      [{ name: true }],
    );
    const appStoreSaved = wizardPersistedDraftReducer(basicSaved, {
      type: "app-store-saved",
      patch: appStorePatch,
    });

    expect(appStoreSaved.basicInformation.name).toBe(
      "Saved from localised content",
    );
    expect(appStoreSaved.appStore.localisations[0].name).toBe(
      "Saved from localised content",
    );
  });
});
