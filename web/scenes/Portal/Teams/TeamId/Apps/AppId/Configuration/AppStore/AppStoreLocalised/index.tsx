import { CategorySelector } from "@/components/Category";
import { CountryBadge } from "@/components/CountryBadge";
import { DecoratedButton } from "@/components/DecoratedButton";
import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/components/Icons/ChevronRightIcon";
import { Input } from "@/components/Input";
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
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
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
  validateAndInsertLocalisationServerSide,
  validateAndUpdateAppLocaleInfoServerSide,
  validateAndUpdateAppSupportInfoServerSide,
  validateAndUpdateLocalisationServerSide,
} from "../server/submit";
import { formSubmitStateAtom } from "./FormSubmitStateProvider";
import { useAddLocaleMutation } from "./graphql/client/add-new-locale.generated";
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

  //
  // ADD WARN ABOUT INDO APPS!!
  //

  // Anchor: Localisation Metadata
  const [
    getLocalisationText,
    { data: localisedData, refetch: refetchLocalisation },
  ] = useFetchLocalisationLazyQuery();

  const updateLocalisationInForm = useCallback(
    async (locale: string) => {
      await getLocalisationText({
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
    formState: { errors, isDirty, isSubmitted },
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
    },
  });

  useEffect(() => {
    if (isDirty) {
      toast.info("You have unsaved changes", {
        autoClose: false,
        toastId: "formState",
      });
    }
    return () => {
      toast.dismiss("formState");
    };
  }, [isDirty]);

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
  }, [
    viewMode,
    reset,
    appMetadata,
    locale,
    localisedData?.localisations,
    getValues,
    description,
  ]);

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
        await refetchLocalisation();
        return;
      }

      if (localisedData?.localisations?.length === 0) {
        await validateAndInsertLocalisationServerSide(commonProperties, appId);
      } else {
        const localisation = localisedData?.localisations?.[0];
        await validateAndUpdateLocalisationServerSide({
          localisation_id: localisation?.id ?? "",
          ...commonProperties,
        });
      }
      await refetchLocalisation();
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
        await saveLocalisation();
        await validateAndUpdateAppSupportInfoServerSide({
          app_metadata_id: appMetadata?.id,
          is_support_email: isSupportEmail,
          support_link: data.support_link,
          support_email: data.support_email,
          app_website_url: data.app_website_url,
          supported_countries: data.supported_countries,
          category: data.category,
        });
        await refetchAppMetadata();
        toast.success("App information updated successfully");
      } catch (e) {
        toast.error("Failed to update app information");
      }
      toast.update("formState", { autoClose: 0 });
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
      if (isDirty) {
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
          await updateLocalisationInForm(targetLang);
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
        await updateLocalisationInForm(targetLang);
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
    ],
  );

  const handleSelectNextLocalisation = useCallback(async () => {
    const currentLocaleIdx = supportedLanguages.indexOf(locale);
    const nextLocaleIdx = currentLocaleIdx + 1;
    const nextLocale =
      supportedLanguages[nextLocaleIdx] || supportedLanguages[0];
    await handleLanguageSwitch(nextLocale);
  }, [locale, supportedLanguages, handleLanguageSwitch]);

  const handleSelectPreviousLocalisation = useCallback(async () => {
    const currentLocaleIdx = supportedLanguages.indexOf(locale);
    const previousLocaleIdx = currentLocaleIdx - 1;
    const previousLocale =
      previousLocaleIdx >= 0
        ? supportedLanguages[previousLocaleIdx]
        : supportedLanguages[supportedLanguages.length - 1];
    await handleLanguageSwitch(previousLocale);
  }, [locale, supportedLanguages, handleLanguageSwitch]);

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
                    Gambling in certain SEA countries
                  </h3>
                  <div className="mt-2 text-yellow-700">
                    Please note that Indonesia, Malaysia, and Thailand do not
                    allow chance-based/gambling mini apps. Make sure your app
                    proposals and updates for these regions comply with local
                    regulations.
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
                  disabled={!isEditable || !isEnoughPermissions}
                  errors={errors.supported_languages}
                  showSelectedList
                  searchPlaceholder="Start by typing language..."
                  canDelete={(item) => item.value !== "en"}
                  onRemove={async (value) => {
                    // Prevent removal of English language
                    if (value === "en") return;

                    field.onChange(
                      field.value?.filter((v) => v !== value) ?? [],
                    );

                    setLocale("en");
                    await addLocaleMutation({
                      variables: {
                        app_metadata_id: appMetadata.id,
                        supported_languages:
                          field.value?.filter((v) => v !== value) ?? [],
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

                    // Delete localisation for removed language
                    if (value !== "en") {
                      try {
                        await deleteLocalisationServerSide(
                          appMetadata.id,
                          value,
                        );
                      } catch (error) {
                        console.error("Failed to delete localisation:", error);
                        toast.error("Failed to delete localisation");
                      }
                    }
                  }}
                  selectAll={() => {
                    const languageValues = allPossibleLanguages.map(
                      (c) => c.value,
                    );
                    addLocaleMutation({
                      variables: {
                        app_metadata_id: appMetadata.id,
                        supported_languages: languageValues,
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
                    field.onChange(languageValues);
                  }}
                  clearAll={async () => {
                    // Delete localisations for all languages except English
                    const languagesToDelete =
                      field.value?.filter((lang) => lang !== "en") ?? [];
                    for (const lang of languagesToDelete) {
                      try {
                        await deleteLocalisationServerSide(
                          appMetadata.id,
                          lang,
                        );
                      } catch (error) {
                        console.error("Failed to delete localisation:", error);
                        toast.error("Failed to delete localisation");
                      }
                    }

                    // Keep English language when clearing all
                    field.onChange(["en"]);
                    await addLocaleMutation({
                      variables: {
                        app_metadata_id: appMetadata.id,
                        supported_languages: ["en"],
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
                  }}
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

                        field.onChange(newSupportedLanguages);

                        await addLocaleMutation({
                          variables: {
                            app_metadata_id: appMetadata.id,
                            supported_languages: newSupportedLanguages,
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

                        // Create empty localisation for new language
                        if (isNewLanguage && value !== "en") {
                          try {
                            await addEmptyLocalisationServerSide(
                              appMetadata.id,
                              value,
                            );
                          } catch (error) {
                            console.error(
                              "Failed to create empty localisation:",
                              error,
                            );
                            toast.error(
                              "Failed to create localisation for new language",
                            );
                          }
                        }
                      }}
                      disabled={!isEditable || !isEnoughPermissions}
                    />
                  )}
                </SelectMultiple>
              )}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {supportedLanguages?.map((lang, index) => {
              const language = languageMap[lang as keyof typeof languageMap];
              if (!language) return null;

              return (
                <CountryBadge
                  key={index}
                  onClick={async () => {
                    await handleLanguageSwitch(lang);
                  }}
                  focused={locale === lang}
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
                  </Typography>
                </CountryBadge>
              );
            })}
          </div>
          <div className="flex flex-row items-center">
            <button type="button" onClick={handleSelectPreviousLocalisation}>
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
              />
              <Input
                register={register("name")}
                errors={errors.name}
                label="App name"
                disabled={!isEditable || !isEnoughPermissions}
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
                disabled={!isEditable || !isEnoughPermissions}
                required
                placeholder="Enter your short app name"
                maxLength={10}
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
                disabled={!isEditable || !isEnoughPermissions}
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
                disabled={!isEditable || !isEnoughPermissions}
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
            <button type="button" onClick={handleSelectNextLocalisation}>
              <ChevronRightIcon className="ml-2 size-8" />
            </button>
          </div>

          <DecoratedButton
            type="submit"
            variant="primary"
            className=" mr-5 h-12 w-40"
            disabled={!isEditable || !isEnoughPermissions}
          >
            <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
          </DecoratedButton>
        </div>
      </form>
    </div>
  );
};
