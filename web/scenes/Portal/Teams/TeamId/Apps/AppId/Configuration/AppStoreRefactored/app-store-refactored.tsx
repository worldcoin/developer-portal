import { CategorySelector } from "@/components/Category";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Link } from "@/components/Link";
import { Notification } from "@/components/Notification";
import { Radio } from "@/components/Radio";
import { SelectMultiple } from "@/components/SelectMultiple";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { formCountriesList, formLanguagesList } from "@/lib/languages";
import { Auth0SessionUser } from "@/lib/types";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { toast } from "react-toastify";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../graphql/client/fetch-app-metadata.generated";
import { AppStoreFormValues } from "./form-schema";
import { FetchLocalisationsDocument } from "./graphql/client/fetch-localisations.generated";
import { MetaTagImageField } from "./ImageForm/MetaTagImageField";
import { ShowcaseImagesField } from "./ImageForm/ShowcaseImagesField";
import { LogoImageUpload } from "./LogoImageUpload";
import { updateAppStoreMetadata } from "./server/update-app-store";

export const AppStoreFormRefactored = (props: {
  appId: string;
  teamId: string;
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  localisationsData: Array<{
    locale: string;
    name?: string | null;
    short_name?: string | null;
    world_app_description?: string | null;
    description?: string | null;
    meta_tag_image_url?: string | null;
    showcase_img_urls?: string[] | null;
  }>;
}) => {
  const { appId, teamId, appMetadata, localisationsData } = props;
  const { user } = useUser() as Auth0SessionUser;
  const searchParams = useSearchParams();

  const { refetch: refetchAppMetadata } = useRefetchQueries(
    FetchAppMetadataDocument,
    { id: appId },
  );
  const { refetch: refetchLocalisations } = useRefetchQueries(
    FetchLocalisationsDocument,
    { app_metadata_id: appMetadata.id },
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty: _isDirty },
  } = useFormContext<AppStoreFormValues>();

  const {
    fields: localisations,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "localisations",
  });

  const supportedLanguages = useWatch({
    control,
    name: "supported_languages",
  });

  // sync localisations with supported_languages
  useEffect(() => {
    if (supportedLanguages) {
      const currentLanguages = localisations.map((field) => field.language);
      const newLanguages = supportedLanguages.filter(
        (lang) => !currentLanguages.includes(lang),
      );
      const removedLanguages = currentLanguages.filter(
        (lang) => !supportedLanguages.includes(lang),
      );

      // remove localisations for removed languages
      removedLanguages.forEach((lang) => {
        const index = localisations.findIndex(
          (field) => field.language === lang,
        );
        if (index !== -1) {
          remove(index);
        }
      });

      // add localisations for new languages
      newLanguages.forEach((lang) => {
        append({
          language: lang,
          name: "",
          short_name: "",
          world_app_description: "",
          description_overview: "",
          meta_tag_image_url: "",
          showcase_img_urls: [],
        });
      });
    }
  }, [supportedLanguages, localisations, append, remove]);

  const submit = useCallback(
    async (data: AppStoreFormValues) => {
      try {
        console.log("submit", data);
        // call server action with app_metadata_id
        const result = await updateAppStoreMetadata({
          ...data,
          app_metadata_id: appMetadata.id,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        // success case
        toast.success(result.message);
        await Promise.all([refetchAppMetadata(), refetchLocalisations()]);
        toast.success("App information updated successfully");
      } catch (e) {
        toast.error("Failed to update app information");
      } finally {
        toast.update("formState", { autoClose: 0 });
      }
    },
    [appMetadata.id, refetchAppMetadata, refetchLocalisations],
  );

  // helpers
  const isEditable = appMetadata?.verification_status === "unverified";
  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);
  const countries = useMemo(() => formCountriesList(), []);
  const allPossibleLanguages = formLanguagesList;
  const supportType = watch("support_type");
  const shouldDefaultOpenLogoEditor = searchParams.get("editLogo") === "true";

  // handle clearing the unused field when support type changes
  const handleSupportTypeChange = useCallback(
    (newType: "email" | "link") => {
      setValue("support_type", newType, { shouldDirty: true });
      if (newType === "email") {
        setValue("support_link", "", { shouldDirty: true });
      } else {
        setValue("support_email", "", { shouldDirty: true });
      }
    },
    [setValue],
  );

  return (
    <div className="mb-24 grid max-w-[580px] grid-cols-1fr/auto">
      {/* logo_img_url */}
      <form className="grid gap-y-6" onSubmit={handleSubmit(submit)}>
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
            Logo image <span className="text-system-error-500">*</span>
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Specify the logo image for your app. Image has to have a 1:1 aspect
            ratio.
          </Typography>
          <LogoImageUpload
            appId={props.appId}
            appMetadataId={props.appMetadata.id}
            teamId={props.teamId}
            editable={true}
            isError={false}
            logoFile={props.appMetadata.logo_img_url}
            defaultOpen={shouldDefaultOpenLogoEditor}
          />
        </div>
        {/* category */}
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
            App category <span className="text-system-error-500">*</span>
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            What category does your app fall into? Select the most relevant
            category. This affects display in the Mini App Store.
          </Typography>
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
          </div>
        </div>
        {/* is_android_only */}
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
            Compliance <span className="text-system-error-500">*</span>
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Does your app have functionality that might potentially be construed
            as gambling or the purchase of digital in game items as{" "}
            <Link
              href="https://developer.apple.com/app-store/review/guidelines/#business"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              defined by Apple here
            </Link>
            ?
          </Typography>
        </div>
        <Controller
          name="is_android_only"
          control={control}
          disabled={!isEditable || !isEnoughPermissions}
          render={({ field }) => (
            <div>
              <div className="flex gap-x-6">
                <Radio
                  label="Yes"
                  value="true"
                  checked={field.value === true}
                  onChange={() => field.onChange(true)}
                  disabled={!isEditable || !isEnoughPermissions}
                  errors={errors.is_android_only}
                />
                <Radio
                  label="No"
                  value="false"
                  checked={field.value === false}
                  onChange={() => field.onChange(false)}
                  disabled={!isEditable || !isEnoughPermissions}
                  errors={errors.is_android_only}
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
          )}
        />

        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
            Is your app for verified humans only?{" "}
            <span className="text-system-error-500">*</span>
          </Typography>

          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Answering yes means your app leverages WorldID in a way that allows
            only unique human users to use the app. This will prevent non
            verified users from downloading the app but make you eligible for a
            special badge in the Mini App Store.
          </Typography>
          <div className="mt-3 flex gap-x-6">
            <Controller
              name="is_for_humans_only"
              control={control}
              disabled={!isEditable || !isEnoughPermissions}
              render={({ field }) => (
                <div>
                  <div className="flex gap-x-6">
                    <Radio
                      label="Yes"
                      value="true"
                      checked={field.value === true}
                      onChange={() => field.onChange(true)}
                      disabled={!isEditable || !isEnoughPermissions}
                      errors={errors.is_for_humans_only}
                    />
                    <Radio
                      label="No"
                      value="false"
                      checked={field.value === false}
                      onChange={() => field.onChange(false)}
                      disabled={!isEditable || !isEnoughPermissions}
                      errors={errors.is_for_humans_only}
                    />
                  </div>
                  {errors.is_for_humans_only && (
                    <Typography
                      variant={TYPOGRAPHY.R4}
                      className="mt-1 text-system-error-500"
                    >
                      {errors.is_for_humans_only.message}
                    </Typography>
                  )}
                </div>
              )}
            />
          </div>
        </div>
        <div className="grid gap-y-5">
          <div className="grid gap-y-3">
            <Typography variant={TYPOGRAPHY.H7}>
              Support <span className="text-system-error-500">*</span>
            </Typography>
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
              Please include a support link where users can reach out to you for
              help.
            </Typography>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <div>
              <div className="grid grid-cols-auto/1fr gap-x-2 pb-2">
                <Radio
                  value={"email"}
                  checked={supportType === "email"}
                  onChange={() => handleSupportTypeChange("email")}
                />
                <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
                  Email
                </Typography>
              </div>
              <Controller
                name="support_email"
                control={control}
                render={({ field }) => (
                  <Input
                    disabled={
                      !isEditable ||
                      !isEnoughPermissions ||
                      supportType !== "email"
                    }
                    placeholder="address@example.com"
                    value={field.value || ""}
                    onChange={field.onChange}
                    errors={errors.support_email}
                  />
                )}
              />
            </div>
            <div>
              <div className="grid grid-cols-auto/1fr gap-x-2 pb-2">
                <Radio
                  value={"link"}
                  checked={supportType === "link"}
                  onChange={() => handleSupportTypeChange("link")}
                />
                <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
                  Link
                </Typography>
              </div>
              <Controller
                name="support_link"
                control={control}
                render={({ field }) => (
                  <Input
                    disabled={
                      !isEditable ||
                      !isEnoughPermissions ||
                      supportType !== "link"
                    }
                    placeholder="https://"
                    value={field.value || ""}
                    onChange={field.onChange}
                    errors={errors.support_link}
                  />
                )}
              />
            </div>
          </div>
        </div>
        {/* app_website_url */}
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
            App website <span className="text-system-error-500">*</span>
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Enter the URL of your App&apos;s website, e.g. a landing page.
          </Typography>
        </div>
        <Controller
          name="app_website_url"
          control={control}
          render={({ field }) => (
            <Input
              label="Official website"
              errors={errors.app_website_url}
              required
              disabled={!isEditable || !isEnoughPermissions}
              placeholder="https://"
              value={field.value || ""}
              onChange={field.onChange}
            />
          )}
        />

        <div className="grid gap-y-5">
          <div className="grid gap-y-3">
            <Typography variant={TYPOGRAPHY.H7}>
              Supported Countries{" "}
              <span className="text-system-error-500">*</span>
            </Typography>
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
              List of countries where your app is available.
            </Typography>
            <Notification variant="warning">
              <div className="text-sm">
                <h3 className="font-medium text-yellow-800">
                  Gambling in certain countries
                </h3>
                <div className="mt-2 text-yellow-700">
                  Please note that Indonesia, Malaysia, Thailand, United States
                  and Poland do not allow chance-based/gambling mini apps. Make
                  sure your app proposals and updates for these regions comply
                  with local regulations.
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
                selectAll={() => field.onChange(countries.map((c) => c.value))}
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

            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
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
                  if (value === "en") return;

                  const newLanguages =
                    field.value?.filter((v) => v !== value) ?? [];
                  field.onChange(newLanguages);
                }}
                selectAll={() => {
                  const languageValues = allPossibleLanguages.map(
                    (c) => c.value,
                  );
                  field.onChange(languageValues);
                }}
                clearAll={async () => {
                  // Keep English language when clearing all
                  const newLanguages = ["en"];
                  field.onChange(newLanguages);
                }}
                canClearAll={field.value?.length !== 1}
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
                    }}
                    disabled={!isEditable || !isEnoughPermissions}
                  />
                )}
              </SelectMultiple>
            )}
          />
        </div>

        {/* localisations section */}

        <div className="grid gap-y-5">
          <div className="grid gap-y-3">
            <Typography variant={TYPOGRAPHY.H7}>
              Localisations <span className="text-system-error-500">*</span>
            </Typography>
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
              Provide localized content for each supported language.
            </Typography>
          </div>
          <div className="max-h-[60vh] space-y-5 overflow-y-scroll rounded-lg border border-grey-200 p-4">
            {localisations.map((field, index) => {
              const languageLabel =
                allPossibleLanguages.find(
                  (lang) => lang.value === field.language,
                )?.label || field.language;

              return (
                <div key={field.id} className="grid gap-y-4 p-4">
                  <Typography
                    variant={TYPOGRAPHY.H7}
                    className={"text-grey-700"}
                  >
                    {languageLabel}
                  </Typography>

                  <div className="grid gap-y-4">
                    {/* name */}
                    <Controller
                      control={control}
                      name={`localisations.${index}.name`}
                      render={({ field: nameField }) => (
                        <Input
                          label="App Name"
                          placeholder="Enter app name"
                          value={nameField.value || ""}
                          onChange={nameField.onChange}
                          disabled={!isEditable || !isEnoughPermissions}
                          errors={errors.localisations?.[index]?.name}
                        />
                      )}
                    />

                    {/* short_name */}
                    <Controller
                      control={control}
                      name={`localisations.${index}.short_name`}
                      render={({ field: shortNameField }) => (
                        <Input
                          label="Short Name"
                          placeholder="Enter short name"
                          value={shortNameField.value || ""}
                          onChange={shortNameField.onChange}
                          disabled={!isEditable || !isEnoughPermissions}
                          errors={errors.localisations?.[index]?.short_name}
                        />
                      )}
                    />

                    {/* world_app_description */}
                    <Controller
                      control={control}
                      name={`localisations.${index}.world_app_description`}
                      render={({ field: descField }) => (
                        <Input
                          label="World App Description"
                          placeholder="Enter description for World App"
                          value={descField.value || ""}
                          onChange={descField.onChange}
                          disabled={!isEditable || !isEnoughPermissions}
                          errors={
                            errors.localisations?.[index]?.world_app_description
                          }
                        />
                      )}
                    />

                    {/* description_overview */}
                    <Controller
                      control={control}
                      name={`localisations.${index}.description_overview`}
                      render={({ field: overviewField }) => (
                        <Input
                          label="Description Overview"
                          placeholder="Enter overview description"
                          value={overviewField.value || ""}
                          onChange={overviewField.onChange}
                          disabled={!isEditable || !isEnoughPermissions}
                          errors={
                            errors.localisations?.[index]?.description_overview
                          }
                        />
                      )}
                    />

                    {/* meta_tag_image_url */}
                    <Controller
                      control={control}
                      name={`localisations.${index}.meta_tag_image_url`}
                      render={({ field: imageField }) => (
                        <MetaTagImageField
                          value={imageField.value}
                          onChange={imageField.onChange}
                          disabled={!isEditable || !isEnoughPermissions}
                          appId={appId}
                          teamId={teamId}
                          locale={field.language}
                          isAppVerified={
                            appMetadata?.verification_status === "verified"
                          }
                          appMetadataId={appMetadata.id}
                          supportedLanguages={supportedLanguages}
                          error={
                            errors.localisations?.[index]?.meta_tag_image_url
                              ?.message
                          }
                          onAutosaveSuccess={() => {
                            refetchAppMetadata();
                            refetchLocalisations();
                          }}
                          onAutosaveError={(error) => {
                            console.error(
                              "showcase images autosave failed:",
                              error,
                            );
                          }}
                        />
                      )}
                    />

                    {/* showcase_img_urls */}
                    <Controller
                      control={control}
                      name={`localisations.${index}.showcase_img_urls`}
                      render={({ field: showcaseField }) => (
                        <ShowcaseImagesField
                          value={(showcaseField.value || []).filter(
                            (url): url is string => Boolean(url),
                          )}
                          onChange={showcaseField.onChange}
                          disabled={!isEditable || !isEnoughPermissions}
                          appId={appId}
                          teamId={teamId}
                          locale={field.language}
                          isAppVerified={
                            appMetadata?.verification_status === "verified"
                          }
                          appMetadataId={appMetadata.id}
                          supportedLanguages={supportedLanguages}
                          error={
                            errors.localisations?.[index]?.showcase_img_urls
                              ?.message
                          }
                          onAutosaveSuccess={() => {
                            refetchAppMetadata();
                            refetchLocalisations();
                          }}
                          onAutosaveError={(error) => {
                            console.error(
                              "showcase images autosave failed:",
                              error,
                            );
                          }}
                        />
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* floating save button tab */}
        <div className="fixed inset-x-0 bottom-0 z-50 h-32 bg-transparent shadow-lg">
          <div className="flex w-full items-center justify-end gap-3 px-8 pt-2 md:pt-8">
            <div className="flex justify-end">
              <DecoratedButton
                type="submit"
                variant="primary"
                className="h-12 w-40"
                disabled={!isEditable || !isEnoughPermissions || isSubmitting}
                onClick={handleSubmit(submit)}
              >
                <Typography variant={TYPOGRAPHY.M3}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Typography>
              </DecoratedButton>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
