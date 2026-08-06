import type { AppStoreFormValues } from "./AppStore/FormSchema/types";
import type { BasicInformationFormValues } from "./BasicInformation/form-schema";

type Localisation = AppStoreFormValues["localisations"][number];

export type PersistedLocalisationPatch = Pick<Localisation, "language"> &
  Partial<Omit<Localisation, "language">>;

/** The exact App Store values accepted by a successful autosave. */
export type AppStorePersistedPatch = Omit<
  AppStoreFormValues,
  "localisations"
> & {
  localisations: PersistedLocalisationPatch[];
};

type DirtyLocalisationFields = Array<Record<string, boolean> | undefined>;

/**
 * Converts an RHF edit buffer into the exact patch the App Store mutation is
 * allowed to persist. English mirror fields that this form did not edit are
 * deliberately omitted rather than copied from a potentially stale buffer.
 */
export const buildAppStorePersistedPatch = (
  values: AppStoreFormValues,
  dirtyLocalisations: DirtyLocalisationFields,
): AppStorePersistedPatch => ({
  ...values,
  localisations: values.localisations.map((localisation, index) => {
    if (localisation.language !== "en") return localisation;

    const dirty = dirtyLocalisations[index];
    if (!dirty) return { language: "en" };

    return {
      language: "en",
      ...(dirty.name && { name: localisation.name }),
      ...(dirty.short_name && { short_name: localisation.short_name }),
      ...(dirty.world_app_description && {
        world_app_description: localisation.world_app_description,
      }),
      ...(dirty.description_overview && {
        description_overview: localisation.description_overview,
      }),
      ...(dirty.meta_tag_image_url && {
        meta_tag_image_url: localisation.meta_tag_image_url,
      }),
      ...(dirty.showcase_img_urls && {
        showcase_img_urls: localisation.showcase_img_urls,
      }),
    };
  }),
});

export type WizardPersistedDraft = {
  basicInformation: Partial<BasicInformationFormValues>;
  appStore: AppStoreFormValues;
};

export type WizardPersistedDraftAction =
  | {
      type: "basic-information-saved";
      patch: Partial<BasicInformationFormValues>;
    }
  | { type: "app-store-saved"; patch: AppStorePersistedPatch }
  | {
      type: "app-store-self-persisted";
      update: (values: AppStoreFormValues) => AppStoreFormValues;
    };

export const cloneAppStoreFormValues = (
  values: AppStoreFormValues,
): AppStoreFormValues => ({
  ...values,
  supported_countries: [...values.supported_countries],
  supported_languages: [...values.supported_languages],
  localisations: values.localisations.map((localisation) => ({
    ...localisation,
    showcase_img_urls: [...(localisation.showcase_img_urls ?? [])],
  })),
});

const mergeAppStorePersistedPatch = (
  current: AppStoreFormValues,
  patch: AppStorePersistedPatch,
): AppStoreFormValues =>
  cloneAppStoreFormValues({
    ...current,
    ...patch,
    // The localisation list itself is authoritative: languages absent from a
    // successful save were removed. Individual English fields may be absent,
    // however, because another form owns their latest persisted value.
    localisations: patch.localisations.map((localisationPatch) => ({
      ...current.localisations.find(
        (localisation) => localisation.language === localisationPatch.language,
      ),
      ...localisationPatch,
    })),
  });

const synchronizeCanonicalName = (
  draft: WizardPersistedDraft,
): WizardPersistedDraft => {
  const english = draft.appStore.localisations.find(
    (localisation) => localisation.language === "en",
  );

  if (english?.name === undefined) return draft;

  return {
    ...draft,
    basicInformation: {
      ...draft.basicInformation,
      name: english.name,
    },
  };
};

/**
 * Single source of truth for fields that are known to have persisted. Form
 * state remains an edit buffer and is never used as proof that a step saved.
 */
export const wizardPersistedDraftReducer = (
  draft: WizardPersistedDraft,
  action: WizardPersistedDraftAction,
): WizardPersistedDraft => {
  if (action.type === "basic-information-saved") {
    const nextDraft: WizardPersistedDraft = {
      basicInformation: {
        ...draft.basicInformation,
        ...action.patch,
      },
      appStore: cloneAppStoreFormValues(draft.appStore),
    };

    if (action.patch.name !== undefined) {
      nextDraft.appStore.localisations = nextDraft.appStore.localisations.map(
        (localisation) =>
          localisation.language === "en"
            ? { ...localisation, name: action.patch.name }
            : localisation,
      );
    }

    return nextDraft;
  }

  const appStore =
    action.type === "app-store-saved"
      ? mergeAppStorePersistedPatch(draft.appStore, action.patch)
      : cloneAppStoreFormValues(action.update(draft.appStore));

  return synchronizeCanonicalName({
    basicInformation: draft.basicInformation,
    appStore,
  });
};
