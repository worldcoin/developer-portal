import { CategorySelector } from "@/components/Category";
import { CountryBadge } from "@/components/CountryBadge";
import { DecoratedButton } from "@/components/DecoratedButton";
import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/components/Icons/ChevronRightIcon";
import { Input } from "@/components/Input";
import { Link } from "@/components/Link";
import { Notification } from "@/components/Notification";
import { Radio } from "@/components/Radio";
import { SelectMultiple } from "@/components/SelectMultiple";
import { TextArea } from "@/components/TextArea";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import {
  formCountriesList,
  formLanguagesList,
  languageMap,
} from "@/lib/languages";
import { Auth0SessionUser } from "@/lib/types";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { checkUserPermissions } from "@/lib/utils";
import { useApolloClient } from "@apollo/client";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useAtom } from "jotai";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../../layout/ImagesProvider";
import { RemainingCharacters } from "../../PageComponents/RemainingCharacters";
import { schema } from "../form-schema";
import {
  addEmptyLocalisationServerSide,
  deleteLocalisationServerSide,
  validateAndUpdateAppLocaleInfoServerSide,
  validateAndUpdateAppSupportInfoServerSide,
  validateAndUpdateLocalisationServerSide,
} from "../server/submit";
import { formSubmitStateAtom } from "./FormSubmitStateProvider";
import { useAddLocaleMutation } from "./graphql/client/add-new-locale.generated";
import { useFetchAllLocalisationsQuery } from "./graphql/client/fetch-all-localisations.generated";
import { useFetchLocalisationLazyQuery } from "./graphql/client/fetch-localisation.generated";
import { ImageForm } from "./ImageForm";
import { parseDescription } from "./utils/util";

type AppStoreLocalisedForm = yup.Asserts<typeof schema>;

export const AppStoreForm = (props: {
  appId: string;
  teamId: string;
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
}) => {
  const { appId, teamId, appMetadata } = props;
  const { user } = useUser() as Auth0SessionUser;
  const countries = useMemo(() => formCountriesList(), []);
  const allPossibleLanguages = formLanguagesList;
  const [isImageOperationInProgress, setIsImageOperationInProgress] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatingLocalisations, setCreatingLocalisations] = useState<
    Set<string>
  >(new Set());
  const [deletingLocalisations, setDeletingLocalisations] = useState<
    Set<string>
  >(new Set());

  const [addLocaleMutation] = useAddLocaleMutation();
  const { refetch: refetchAppMetadata } = useRefetchQueries(
    FetchAppMetadataDocument,
    { id: appId },
  );

  const [locale, setLocale] = useState("en");
  const [isSupportEmail, setIsSupportEmail] = useState(
    appMetadata?.support_link?.startsWith("mailto:") ?? false,
  );

  const [viewMode] = useAtom(viewModeAtom);
  const [, setFormSubmitState] = useAtom(formSubmitStateAtom);

  const isEditable = appMetadata?.verification_status === "unverified";

  // Anchor: Localisation Metadata
  const [
    getLocalisationText,
    { data: localisedData, refetch: refetchLocalisation },
  ] = useFetchLocalisationLazyQuery({});

  const { data: allLocalisationsData, loading: allLocalisationsLoading } =
    useFetchAllLocalisationsQuery({
      variables: {
        app_metadata_id: appMetadata.id,
      },
    });

  const client = useApolloClient();

  const createLocalisation = useCallback(
    async (lang: string) => {
      try {
        await addEmptyLocalisationServerSide(appMetadata.id, lang, appId);
        await refetchLocalisation({
          id: appMetadata.id,
          locale: lang,
        });
        client.cache.evict({
          fieldName: "get_all_unverified_images",
          args: {
            app_id: appId,
            team_id: teamId,
            locale: lang,
          },
        });
        client.cache.gc();
        // Remove from creating set when done
        setCreatingLocalisations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(lang);
          return newSet;
        });
      } catch (error) {
        console.error("Failed to add localisation:", error);
        toast.error("Failed to add localisation");
        // Remove from creating set on error
        setCreatingLocalisations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(lang);
          return newSet;
        });
      }
    },
    [appMetadata.id, appId, refetchLocalisation],
  );

  // Check for missing localisations on initial load
  useEffect(() => {
    if (
      !appMetadata?.id ||
      !appMetadata?.supported_languages ||
      !allLocalisationsData?.localisations ||
      allLocalisationsLoading
    ) {
      return;
    }

    const existingLocales = new Set(
      allLocalisationsData.localisations.map((l) => l.locale),
    );

    // Filter out English and get missing non-English locales
    const missingLocales = appMetadata.supported_languages.filter(
      (lang) => lang !== "en" && !existingLocales.has(lang),
    );

    if (missingLocales.length > 0) {
      // Add missing locales to creating set
      setCreatingLocalisations((prev) => {
        const newSet = new Set(prev);
        missingLocales.forEach((lang) => newSet.add(lang));
        return newSet;
      });

      // Create missing localisations in parallel
      Promise.all(
        missingLocales.map(async (lang) => {
          try {
            await createLocalisation(lang);
          } catch (error) {
            console.error(`Failed to create localisation for ${lang}:`, error);
            toast.error(`Failed to create localisation for ${lang}`);
          }
        }),
      ).catch((error) => {
        console.error("Failed to create some localisations:", error);
        toast.error("Failed to create some localisations");
      });
    }
  }, [allLocalisationsData?.localisations, allLocalisationsLoading]);

  const handleLocalisationUpdate = useCallback(
    async (oldLanguages: string[], newLanguages: string[]) => {
      try {
        // Find languages to add and remove
        const languagesToAdd = newLanguages.filter(
          (lang) => !oldLanguages.includes(lang) && lang !== "en",
        );
        const languagesToRemove = oldLanguages.filter(
          (lang) => !newLanguages.includes(lang) && lang !== "en",
        );
        // Add new languages to creating set
        setCreatingLocalisations((prev) => {
          const newSet = new Set(prev);
          languagesToAdd.forEach((lang) => newSet.add(lang));
          return newSet;
        });

        // Add languages to deleting set
        setDeletingLocalisations((prev) => {
          const newSet = new Set(prev);
          languagesToRemove.forEach((lang) => newSet.add(lang));
          return newSet;
        });

        await addLocaleMutation({
          variables: {
            app_metadata_id: appMetadata.id,
            supported_languages: newLanguages,
          },
          refetchQueries: [
            {
              query: FetchAppMetadataDocument,
              variables: {
                id: appId,
              },
            },
          ],
        });

        // Create empty localisations for new languages and delete removed ones in parallel
        const addPromises = languagesToAdd.map(async (lang) => {
          await createLocalisation(lang);
        });

        const removePromises = languagesToRemove.map(async (lang) => {
          try {
            await deleteLocalisationServerSide(appMetadata.id, lang);
            // Remove from deleting set when done
            setDeletingLocalisations((prev) => {
              const newSet = new Set(prev);
              newSet.delete(lang);
              return newSet;
            });
          } catch (error) {
            console.error("Failed to delete localisation:", error);
            toast.error("Failed to delete localisation");
            // Remove from deleting set on error
            setDeletingLocalisations((prev) => {
              const newSet = new Set(prev);
              newSet.delete(lang);
              return newSet;
            });
          }
        });

        // Execute all promises in parallel
        await Promise.all([...addPromises, ...removePromises]);

        // If current locale is removed, switch to English
        if (languagesToRemove.includes(locale)) {
          setLocale("en");
        }
      } catch (error) {
        console.error("Failed to update localisations:", error);
        toast.error("Failed to update localisations");
      }
    },
    [
      appMetadata.id,
      appId,
      teamId,
      addLocaleMutation,
      refetchLocalisation,
      locale,
      client,
    ],
  );

  const updateLocalisationInForm = useCallback(
    async (locale: string) => {
      getLocalisationText({
        variables: {
          id: appMetadata.id,
          locale: locale,
        },
      });
      setLocale(locale);
    },
    [appMetadata.id, getLocalisationText],
  );

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const description = useMemo(() => {
    if (locale === "en") {
      return parseDescription(appMetadata?.description ?? "");
    } else {
      return parseDescription(
        localisedData?.localisations?.[0]?.description ?? "",
      );
    }
  }, [appMetadata?.description, locale, localisedData?.localisations]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    getValues,
    formState: { errors, isDirty, dirtyFields, isSubmitted },
  } = useForm<AppStoreLocalisedForm>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      ...appMetadata,
      ...description,
      supported_countries: appMetadata?.supported_countries ?? [],
      support_email: isSupportEmail
        ? appMetadata?.support_link.replace("mailto:", "")
        : "",
      support_link: isSupportEmail ? "" : appMetadata?.support_link,
      is_android_only: appMetadata?.is_android_only ?? null,
    },
  });

  // Track which fields are relevant for the current locale
  const isLocaleRelevantField = useCallback((field: string) => {
    const localeRelevantFields = [
      "name",
      "short_name",
      "world_app_description",
      "description_overview",
      "description_how_it_works",
      "description_connect",
      "world_app_button_text",
    ];
    return localeRelevantFields.includes(field);
  }, []);

  // Check if only locale-irrelevant fields are dirty
  const hasOnlyLocaleIrrelevantChanges = useCallback(() => {
    return Object.keys(dirtyFields).every(
      (field) => !isLocaleRelevantField(field),
    );
  }, [dirtyFields, isLocaleRelevantField]);

  useEffect(() => {
    if (isDirty && !hasOnlyLocaleIrrelevantChanges()) {
      toast.info("You have unsaved changes", {
        autoClose: false,
        toastId: "formState",
      });
    }
    return () => {
      toast.dismiss("formState");
    };
  }, [isDirty, hasOnlyLocaleIrrelevantChanges]);

  const isFormDisabled = useMemo(() => {
    if (locale === "en") {
      return (
        !isEditable || !isEnoughPermissions || isSubmitting || !appMetadata
      );
    }
    return (
      !isEditable ||
      !isEnoughPermissions ||
      isSubmitting ||
      !localisedData?.localisations?.[0]
    );
  }, [
    isEditable,
    isEnoughPermissions,
    isSubmitting,
    localisedData?.localisations,
    locale,
  ]);

  useEffect(() => {
    const localisedItem =
      locale === "en" ? appMetadata : localisedData?.localisations?.[0];
    const formValues = getValues();
    reset({
      ...formValues,
      ...description,
      name: localisedItem?.name ?? "",
      short_name: localisedItem?.short_name ?? "",
      world_app_description: localisedItem?.world_app_description ?? "",
      world_app_button_text: localisedItem?.world_app_button_text ?? "",
      supported_languages: formValues?.supported_languages ?? [],
      app_website_url: formValues?.app_website_url ?? "",
    });
  }, [viewMode, reset, locale, getValues, isFormDisabled]);

  useEffect(() => {
    setFormSubmitState({ isSubmitted });
  }, [isSubmitted, setFormSubmitState]);

  const saveLocalisation = useCallback(async () => {
    const data = getValues();
    const {
      name,
      short_name,
      world_app_description,
      world_app_button_text,
      ..._
    } = data;
    const commonProperties = {
      description_overview: data.description_overview,
      description_how_it_works: data.description_how_it_works,
      description_connect: data.description_connect,
      app_metadata_id: appMetadata?.id ?? "",
      locale: locale,
      name,
      short_name,
      world_app_button_text,
      world_app_description,
    } as const;

    try {
      // if locale is en, set the data on app_metadata directly
      if (locale === "en") {
        await validateAndUpdateAppLocaleInfoServerSide(commonProperties);
        await refetchAppMetadata();
        return;
      }

      const localisation = localisedData?.localisations?.[0];

      await validateAndUpdateLocalisationServerSide({
        localisation_id: localisation?.id ?? "",
        ...commonProperties,
      });
      await refetchLocalisation({
        id: appMetadata.id,
        locale: locale,
      });
    } catch (e) {
      console.error("App information failed to update: ", e);
      toast.error("Failed to save localisation");
    }
  }, [
    appId,
    appMetadata?.id,
    getValues,
    locale,
    localisedData,
    refetchLocalisation,
  ]);

  // Anchor: Submit Form
  const submit = useCallback(
    async (data: AppStoreLocalisedForm) => {
      try {
        setIsSubmitting(true);
        await saveLocalisation();
        await validateAndUpdateAppSupportInfoServerSide({
          app_metadata_id: appMetadata?.id,
          is_support_email: isSupportEmail,
          support_link: data.support_link,
          support_email: data.support_email,
          app_website_url: data.app_website_url,
          supported_countries: data.supported_countries,
          category: data.category,
          is_android_only: data.is_android_only,
        });
        await refetchAppMetadata();
        toast.success("App information updated successfully");
      } catch (e) {
        toast.error("Failed to update app information");
      } finally {
        setIsSubmitting(false);
        toast.update("formState", { autoClose: 0 });
      }
    },
    [appMetadata?.id, isSupportEmail, refetchAppMetadata, saveLocalisation],
  );

  const supportedLanguages = useWatch({
    control,
    name: "supported_languages",
  });

  const hasImages = useCallback(
    (locale: string) => {
      if (locale === "en") {
        return !!(
          appMetadata?.hero_image_url ||
          (appMetadata?.showcase_img_urls &&
            appMetadata.showcase_img_urls.length > 0)
        );
      } else {
        return !!(
          localisedData?.localisations?.[0]?.hero_image_url ||
          (localisedData?.localisations?.[0]?.showcase_img_urls &&
            localisedData.localisations[0].showcase_img_urls.length > 0)
        );
      }
    },
    [
      appMetadata?.hero_image_url,
      appMetadata?.showcase_img_urls,
      localisedData?.localisations,
    ],
  );

  const hasEmptyRequiredFields = useCallback(
    (data: any, targetLocale: string) => {
      // Check current form data
      const formIsEmpty =
        !data.name &&
        !data.short_name &&
        !data.world_app_description &&
        !data.description_overview;

      // Check localisation data
      const localisationIsEmpty =
        targetLocale === "en"
          ? !appMetadata?.name &&
            !appMetadata?.short_name &&
            !appMetadata?.world_app_description &&
            !appMetadata?.description
          : !localisedData?.localisations?.[0]?.name &&
            !localisedData?.localisations?.[0]?.short_name &&
            !localisedData?.localisations?.[0]?.world_app_description &&
            !localisedData?.localisations?.[0]?.description;

      return formIsEmpty && localisationIsEmpty;
    },
    [appMetadata, localisedData],
  );

  const handleLanguageSwitch = useCallback(
    async (targetLang: string) => {
      if (isSubmitting || isImageOperationInProgress) {
        return;
      }

      if (isDirty && !hasOnlyLocaleIrrelevantChanges()) {
        // Validate form data before switching
        const formData = getValues();
        const isValid = await schema.isValid(formData);

        if (!isValid) {
          toast.error(
            "Please fill in all required fields before switching languages",
            {
              toastId: "localisation-incomplete",
            },
          );
          return;
        }

        try {
          await saveLocalisation();
          updateLocalisationInForm(targetLang);
        } catch (error) {
          toast.error("Failed to save current localisation");
          return;
        }
      } else {
        const currentData = getValues();
        if (hasImages(locale) && hasEmptyRequiredFields(currentData, locale)) {
          toast.warn(
            "Your images are saved but will not be displayed in the App Store until you fill in all required fields",
          );
        }
        updateLocalisationInForm(targetLang);
      }
    },
    [
      isDirty,
      getValues,
      saveLocalisation,
      updateLocalisationInForm,
      locale,
      hasImages,
      hasEmptyRequiredFields,
      isSubmitting,
      isImageOperationInProgress,
      hasOnlyLocaleIrrelevantChanges,
    ],
  );

  const handleSelectNextLocalisation = useCallback(async () => {
    const currentLocaleIdx = supportedLanguages.indexOf(locale);
    let nextLocaleIdx = currentLocaleIdx + 1;
    let nextLocale = supportedLanguages[nextLocaleIdx];

    // Skip locales that are being created
    while (nextLocale && creatingLocalisations.has(nextLocale)) {
      nextLocaleIdx++;
      nextLocale = supportedLanguages[nextLocaleIdx];
    }

    // If we've reached the end, start from the beginning
    if (!nextLocale) {
      nextLocaleIdx = 0;
      nextLocale = supportedLanguages[0];
      // Skip locales that are being created from the beginning
      while (nextLocale && creatingLocalisations.has(nextLocale)) {
        nextLocaleIdx++;
        nextLocale = supportedLanguages[nextLocaleIdx];
      }
    }

    // If we found a valid locale, switch to it
    if (nextLocale) {
      await handleLanguageSwitch(nextLocale);
    }
  }, [locale, supportedLanguages, handleLanguageSwitch, creatingLocalisations]);

  const handleSelectPreviousLocalisation = useCallback(async () => {
    const currentLocaleIdx = supportedLanguages.indexOf(locale);
    let previousLocaleIdx = currentLocaleIdx - 1;
    let previousLocale =
      previousLocaleIdx >= 0 ? supportedLanguages[previousLocaleIdx] : null;

    // Skip locales that are being created
    while (previousLocale && creatingLocalisations.has(previousLocale)) {
      previousLocaleIdx--;
      previousLocale =
        previousLocaleIdx >= 0 ? supportedLanguages[previousLocaleIdx] : null;
    }

    // If we've reached the beginning, start from the end
    if (!previousLocale) {
      previousLocaleIdx = supportedLanguages.length - 1;
      previousLocale = supportedLanguages[previousLocaleIdx];
      // Skip locales that are being created from the end
      while (previousLocale && creatingLocalisations.has(previousLocale)) {
        previousLocaleIdx--;
        previousLocale =
          previousLocaleIdx >= 0 ? supportedLanguages[previousLocaleIdx] : null;
      }
    }

    // If we found a valid locale, switch to it
    if (previousLocale) {
      await handleLanguageSwitch(previousLocale);
    }
  }, [locale, supportedLanguages, handleLanguageSwitch, creatingLocalisations]);

  return (
    <div className="grid max-w-[580px] grid-cols-1fr/auto">
      <form className="grid" onSubmit={handleSubmit(submit)}>
        <div className="grid gap-y-7">
          <Controller
            name="category"
            control={control}
            render={({ field }) => {
              return (
                <CategorySelector
                  value={field.value}
                  required
                  disabled={!isEditable}
                  onChange={field.onChange}
                  errors={errors.category}
                  label="Category"
                />
              );
            }}
          />
          <div className="grid gap-y-3">
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
              Compliance
            </Typography>
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
              Does your app have functionality that might potentially be
              construed as gambling or the purchase of digital in game items as{" "}
              <Link
                href="https://developer.apple.com/app-store/review/guidelines/#business"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                defined by Apple here
              </Link>
              ?<span className="text-system-error-500">*</span>
            </Typography>

            <div className="mt-3 flex gap-x-6">
              <Controller
                name="is_android_only"
                control={control}
                disabled={!isEditable || !isEnoughPermissions}
                render={({ field }) => (
                  <>
                    <Radio
                      label="Yes"
                      value="true"
                      checked={field.value === true}
                      onChange={() => field.onChange(true)}
                      disabled={!isEditable || !isEnoughPermissions}
                    />
                    <Radio
                      label="No"
                      value="false"
                      checked={field.value === false}
                      onChange={() => field.onChange(false)}
                      disabled={!isEditable || !isEnoughPermissions}
                    />
                  </>
                )}
              />
            </div>
            {errors.is_android_only && (
              <Typography
                variant={TYPOGRAPHY.R4}
                className="mt-1 text-system-error-500"
              >
                {errors.is_android_only.message}
              </Typography>
            )}
          </div>
          <div className="grid gap-y-5">
            <div className="grid gap-y-3">
              <Typography variant={TYPOGRAPHY.H7}>
                Support <span className="text-system-error-500">*</span>
              </Typography>
              <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                Please include a support link where users can reach out to you
                for help.
              </Typography>
            </div>
            {/* Pending designs change this to a switcher */}
            <div className="grid grid-cols-2 gap-x-4">
              <div>
                <div className="grid grid-cols-auto/1fr gap-x-2 pb-2">
                  <Radio
                    value={"email"}
                    checked={isSupportEmail}
                    onChange={() => {
                      setIsSupportEmail(true);
                    }}
                  />
                  <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
                    Email
                  </Typography>
                </div>
                <Input
                  disabled={
                    !isEditable || !isEnoughPermissions || !isSupportEmail
                  }
                  placeholder="address@example.com"
                  register={register("support_email")}
                  errors={errors.support_email}
                />
              </div>
              <div>
                <div className="grid grid-cols-auto/1fr gap-x-2 pb-2">
                  <Radio
                    value={"link"}
                    checked={!isSupportEmail}
                    onChange={() => setIsSupportEmail(false)}
                  />
                  <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
                    Link
                  </Typography>
                </div>
                <Input
                  disabled={
                    !isEditable || !isEnoughPermissions || isSupportEmail
                  }
                  placeholder="https://"
                  register={register("support_link")}
                  errors={errors.support_link}
                />
              </div>
            </div>
          </div>

          <Input
            label="Official website"
            errors={errors.app_website_url}
            required
            disabled={!isEditable || !isEnoughPermissions}
            placeholder="https://"
            register={register("app_website_url")}
          />

          <div className="grid gap-y-5">
            <div className="grid gap-y-3">
              <Typography variant={TYPOGRAPHY.H7}>
                Supported Countries{" "}
                <span className="text-system-error-500">*</span>
              </Typography>
              <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                List of countries where your app is available.
              </Typography>
              <Notification variant="warning">
                <div className="text-sm">
                  <h3 className="font-medium text-yellow-800">
                    Gambling in certain countries
                  </h3>
                  <div className="mt-2 text-yellow-700">
                    Please note that Indonesia, Malaysia, Thailand, United
                    States and Poland do not allow chance-based/gambling mini
                    apps. Make sure your app proposals and updates for these
                    regions comply with local regulations.
                  </div>
                </div>
              </Notification>
            </div>
            <Controller
              control={control}
              name="supported_countries"
              render={({ field }) => (
                <SelectMultiple
                  values={field.value}
                  onRemove={(value) =>
                    field.onChange(field.value.filter((v) => v !== value) ?? [])
                  }
                  items={countries}
                  label=""
                  disabled={!isEditable || !isEnoughPermissions}
                  errors={errors.supported_countries}
                  required
                  selectAll={() =>
                    field.onChange(countries.map((c) => c.value))
                  }
                  clearAll={() => field.onChange([])}
                  showSelectedList
                  searchPlaceholder="Start by typing country..."
                >
                  {(item, index) => (
                    <SelectMultiple.Item
                      icon={
                        <Image
                          width={20}
                          height={20}
                          className="size-5"
                          src={`${process.env.NEXT_PUBLIC_APP_URL}/icons/flags/${item.value}.svg`}
                          alt={`${item.value} flag`}
                        />
                      }
                      key={index}
                      item={item}
                      index={index}
                      checked={field.value?.includes(item.value)}
                      onChange={(value) => {
                        if (!field.value) {
                          return field.onChange([]);
                        }

                        field.onChange(
                          field.value.some((v) => v === value)
                            ? field.value.filter((v) => v !== value)
                            : [...field.value, value],
                        );
                      }}
                      disabled={!isEditable || !isEnoughPermissions}
                    />
                  )}
                </SelectMultiple>
              )}
            />
          </div>

          <div className="grid gap-y-5">
            <div className="grid gap-y-3">
              <Typography id="languages" variant={TYPOGRAPHY.H7}>
                Supported Languages{" "}
                <span className="text-system-error-500">*</span>
              </Typography>

              <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                Select a list of languages your app supports.
              </Typography>
            </div>
            <Controller
              control={control}
              name="supported_languages"
              render={({ field }) => (
                <SelectMultiple
                  values={field.value}
                  items={allPossibleLanguages}
                  label=""
                  disabled={
                    !isEditable ||
                    !isEnoughPermissions ||
                    allLocalisationsLoading
                  }
                  errors={errors.supported_languages}
                  showSelectedList
                  searchPlaceholder="Start by typing language..."
                  canDelete={(item) =>
                    item.value !== "en" &&
                    !isImageOperationInProgress &&
                    !creatingLocalisations.has(item.value)
                  }
                  onRemove={async (value) => {
                    // Prevent removal of English language, if operation is in progress, or if localisation is being created
                    if (
                      value === "en" ||
                      isImageOperationInProgress ||
                      isSubmitting ||
                      creatingLocalisations.has(value)
                    )
                      return;

                    const newLanguages =
                      field.value?.filter((v) => v !== value) ?? [];
                    handleLocalisationUpdate(field.value ?? [], newLanguages);
                    field.onChange(newLanguages);
                  }}
                  selectAll={() => {
                    const languageValues = allPossibleLanguages.map(
                      (c) => c.value,
                    );
                    handleLocalisationUpdate(field.value ?? [], languageValues);
                    field.onChange(languageValues);
                  }}
                  clearAll={async () => {
                    // Keep English language when clearing all
                    const newLanguages = ["en"];
                    setLocale("en");
                    handleLocalisationUpdate(field.value ?? [], newLanguages);
                    field.onChange(newLanguages);
                  }}
                  canClearAll={creatingLocalisations.size === 0}
                >
                  {(item, index) => (
                    <SelectMultiple.Item
                      item={item}
                      key={index}
                      index={index}
                      checked={field.value?.includes(item.value)}
                      onChange={async (value) => {
                        if (!field.value) {
                          return field.onChange([]);
                        }

                        const isNewLanguage = !field.value.includes(value);
                        const newSupportedLanguages = isNewLanguage
                          ? [...field.value, value]
                          : field.value.filter((v) => v !== value);

                        handleLocalisationUpdate(
                          field.value,
                          newSupportedLanguages,
                        );
                        field.onChange(newSupportedLanguages);
                      }}
                      disabled={
                        !isEditable ||
                        !isEnoughPermissions ||
                        isSubmitting ||
                        creatingLocalisations.has(item.value) ||
                        deletingLocalisations.has(item.value) ||
                        allLocalisationsLoading
                      }
                    />
                  )}
                </SelectMultiple>
              )}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ...(supportedLanguages || []),
              ...Array.from(deletingLocalisations),
            ].map((lang, index) => {
              const language = languageMap[lang as keyof typeof languageMap];
              if (!language) return null;

              const isCreating = creatingLocalisations.has(lang);
              const isDeleting = deletingLocalisations.has(lang);
              const isDisabled =
                isImageOperationInProgress ||
                isSubmitting ||
                isCreating ||
                isDeleting ||
                allLocalisationsLoading;

              return (
                <CountryBadge
                  key={lang}
                  onClick={async () => {
                    if (!isDisabled) {
                      await handleLanguageSwitch(lang);
                    }
                  }}
                  focused={locale === lang}
                  className={clsx({
                    "cursor-not-allowed opacity-50": isDisabled,
                  })}
                >
                  <Image
                    width={20}
                    height={20}
                    className="size-5"
                    src={`${process.env.NEXT_PUBLIC_APP_URL}/icons/flags/${language?.country_code}.svg`}
                    alt={`lang flag`}
                  />
                  <Typography variant={TYPOGRAPHY.R5}>
                    {language?.label}
                    {isCreating && " (Creating...)"}
                    {isDeleting && " (Deleting...)"}
                    {allLocalisationsLoading && " (Loading...)"}
                  </Typography>
                </CountryBadge>
              );
            })}
          </div>
          <div className="flex flex-row items-center">
            <button
              type="button"
              onClick={handleSelectPreviousLocalisation}
              disabled={
                isImageOperationInProgress ||
                isSubmitting ||
                creatingLocalisations.size === supportedLanguages.length
              }
              className={clsx({
                "cursor-not-allowed opacity-50":
                  isImageOperationInProgress ||
                  isSubmitting ||
                  creatingLocalisations.size === supportedLanguages.length,
              })}
            >
              <ChevronLeftIcon className="mr-2 size-8" />
            </button>
            <div>
              <ImageForm
                appId={appId}
                teamId={teamId}
                locale={locale}
                appMetadataId={appMetadata?.id ?? ""}
                appMetadata={appMetadata}
                localisation={localisedData?.localisations?.[0]}
                onOperationStateChange={setIsImageOperationInProgress}
              />
              <Input
                register={register("name")}
                errors={errors.name}
                label="App name"
                disabled={isFormDisabled}
                required
                placeholder="Enter your App Name"
                maxLength={50}
                addOnRight={
                  <RemainingCharacters text={watch("name")} maxChars={50} />
                }
              />
              <Input
                register={register("short_name")}
                errors={errors.short_name}
                label="Short name"
                disabled={isFormDisabled}
                required
                placeholder="Enter your short app name"
                maxLength={11}
                addOnRight={
                  <RemainingCharacters
                    text={watch("short_name")}
                    maxChars={10}
                  />
                }
              />
              <Input
                register={register("world_app_description")}
                errors={errors.world_app_description}
                label="App tag line"
                disabled={isFormDisabled}
                required
                placeholder="Short app store tagline"
                maxLength={35}
                addOnRight={
                  <RemainingCharacters
                    text={watch("world_app_description")}
                    maxChars={35}
                  />
                }
              />
              <TextArea
                label="Overview"
                required
                rows={5}
                maxLength={1500}
                errors={errors.description_overview}
                disabled={isFormDisabled}
                addOn={
                  <RemainingCharacters
                    text={watch("description_overview")}
                    maxChars={1500}
                  />
                }
                placeholder="Give an overview of your app to potential users. What does it do? Why should they use it?"
                register={register("description_overview")}
              />
            </div>
            <button
              type="button"
              onClick={handleSelectNextLocalisation}
              disabled={
                isImageOperationInProgress ||
                isSubmitting ||
                creatingLocalisations.size === supportedLanguages.length
              }
              className={clsx({
                "cursor-not-allowed opacity-50":
                  isImageOperationInProgress ||
                  isSubmitting ||
                  creatingLocalisations.size === supportedLanguages.length,
              })}
            >
              <ChevronRightIcon className="ml-2 size-8" />
            </button>
          </div>

          <DecoratedButton
            type="submit"
            variant="primary"
            className="mr-5 h-12 w-40"
            disabled={!isEditable || !isEnoughPermissions || isSubmitting}
          >
            <Typography variant={TYPOGRAPHY.M3}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Typography>
          </DecoratedButton>
        </div>
      </form>
    </div>
  );
};
