"use client";
import { CategorySelector } from "@/components/Category";
import { CopyButton } from "@/components/CopyButton";
import { CountryBadge } from "@/components/CountryBadge";
import { DecoratedButton } from "@/components/DecoratedButton";
import { PlusCircleIcon } from "@/components/Icons/PlusCircleIcon";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useAtom } from "jotai";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { RemainingCharacters } from "../../PageComponents/RemainingCharacters";
import { languageMap } from "../../Setup/page/helpers/form-countries-list";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../../layout/ImagesProvider";
import { encodeDescription, parseDescription } from "./descriptions/util";
import { useFetchLocalisationLazyQuery } from "./graphql/client/fetch-localisation.generated";
import { useInsertLocalisationMutation } from "./graphql/client/insert-localisation.generated";
import { useUpdateAppInfoMutation } from "./graphql/client/update-app.generated";
import { useUpdateLocalisationMutation } from "./graphql/client/update-localisation.generated";

function noLinks(value: string | undefined) {
  if (!value) return true;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return !urlRegex.test(value);
}

const schema = yup.object({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  short_name: yup.string().required("Short name is required").max(10),
  category: yup.string().optional(),
  world_app_description: yup
    .string()
    .max(35, "Annotation cannot exceed 35 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .required(),
  world_app_button_text: yup
    .string()
    .max(25, "Content cannot exceed 25 characters")
    .optional(),
  integration_url: yup
    .string()
    .url("Must be a valid https:// URL")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "Link must be a valid HTTPS URL",
      excludeEmptyString: true,
    })
    .required("This field is required"),
  app_website_url: yup
    .string()
    .url("Must be a valid https:// URL")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "Link must be a valid HTTPS URL",
      excludeEmptyString: true,
    })
    .required("This field is required"),
  description_overview: yup
    .string()
    .max(1500, "Overview cannot exceed 1500 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .required("This section is required"),
  description_how_it_works: yup
    .string()
    .max(1500, "How it works cannot exceed 1500 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .optional(),
  description_connect: yup
    .string()
    .max(1500, "How to connect cannot exceed 1500 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .optional(),
});

export type BasicInformationFormValues = yup.Asserts<typeof schema>;

export const BasicInformation = (props: {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
  teamName: string;
}) => {
  const { appId, teamId, app, teamName } = props;
  const [updateAppInfoMutation, { loading }] = useUpdateAppInfoMutation();
  const [updateLocalisationMutation] = useUpdateLocalisationMutation();
  const [insertLocalisationMutation] = useInsertLocalisationMutation();

  const [locale, setLocale] = useState("en");
  const [viewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const router = useRouter();

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const appMetaData = useMemo(() => {
    if (viewMode === "verified") {
      return app.verified_app_metadata[0];
    } else {
      // Null check in case app got verified and has no unverified metadata
      return app.app_metadata?.[0] ?? app.verified_app_metadata[0];
    }
  }, [app, viewMode]);

  const [
    getLocalisationText,
    { data: localisedData, refetch: refetchLocalisation },
  ] = useFetchLocalisationLazyQuery();

  const updateLocalisation = async (locale: string) => {
    await getLocalisationText({
      variables: {
        id: appMetaData.id,
        locale: locale,
      },
    });
    setLocale(locale);
  };

  const isEditable = appMetaData?.verification_status === "unverified";

  const description = useMemo(() => {
    if (locale === "en") {
      return parseDescription(appMetaData?.description ?? "");
    } else {
      return parseDescription(
        localisedData?.localisations?.[0]?.description ?? "",
      );
    }
  }, [appMetaData?.description, locale, localisedData?.localisations]);

  const editableAppMetadata = useMemo(() => {
    return {
      name: appMetaData?.name,
      short_name: appMetaData?.short_name,
      world_app_description: appMetaData?.world_app_description,
      world_app_button_text: appMetaData?.world_app_button_text,
      category: appMetaData?.category,
      integration_url: appMetaData?.integration_url,
      app_website_url: appMetaData?.app_website_url,
    };
  }, [appMetaData]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<BasicInformationFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      ...editableAppMetadata,
      ...description,
    },
  });

  // Used to update the fields when view mode is change
  useEffect(() => {
    if (locale !== "en") {
      const localisedItem = localisedData?.localisations?.[0];
      reset({
        category: editableAppMetadata?.category,
        integration_url: editableAppMetadata?.integration_url,
        app_website_url: editableAppMetadata?.app_website_url,
        name: localisedItem?.name ?? "",
        short_name: localisedItem?.short_name ?? "",
        world_app_description: localisedItem?.world_app_description ?? "",
        world_app_button_text: localisedItem?.world_app_button_text ?? "",
        ...description,
      });
    } else {
      reset({
        ...editableAppMetadata,
        ...description,
      });
    }
  }, [
    viewMode,
    reset,
    appMetaData,
    description,
    locale,
    localisedData?.localisations,
    editableAppMetadata,
  ]);

  const submit = useCallback(
    async (data: BasicInformationFormValues) => {
      if (loading) return;
      try {
        const {
          description_overview,
          description_connect,
          description_how_it_works,
          ...formData
        } = data;

        let result;

        if (locale !== "en") {
          const localisedFormData = {
            name: formData.name,
            short_name: formData.short_name,
            world_app_description: formData.world_app_description,
            world_app_button_text: formData.world_app_button_text,
          };

          if (localisedData?.localisations?.length === 0) {
            result = await insertLocalisationMutation({
              variables: {
                input: {
                  description: encodeDescription(
                    data.description_overview,
                    data.description_how_it_works,
                    data.description_connect,
                  ),
                  app_metadata_id: appMetaData?.id ?? "",
                  locale: locale,
                  ...localisedFormData,
                },
              },
            });
          } else {
            const localisation = localisedData?.localisations?.[0];
            result = await updateLocalisationMutation({
              variables: {
                localisation_id: localisation?.id ?? "",
                input: {
                  description: encodeDescription(
                    data.description_overview,
                    data.description_how_it_works,
                    data.description_connect,
                  ),
                  ...localisedFormData,
                },
              },
            });
          }
          await refetchLocalisation();
        } else {
          result = await updateAppInfoMutation({
            variables: {
              app_metadata_id: appMetaData?.id,
              input: {
                description: encodeDescription(
                  data.description_overview,
                  data.description_how_it_works,
                  data.description_connect,
                ),
                ...formData,
              },
            },

            refetchQueries: [
              {
                query: FetchAppMetadataDocument,
                variables: { id: appId },
              },
            ],
            awaitRefetchQueries: true,
          });
        }
        if (result instanceof Error) {
          throw result;
        }
        toast.success("App information updated successfully");
      } catch (e) {
        console.error("Basic Info Failed to Update: ", e);
        toast.error("Failed to update app information");
      }
    },
    [
      appId,
      appMetaData?.id,
      insertLocalisationMutation,
      loading,
      locale,
      localisedData?.localisations,
      refetchLocalisation,
      updateAppInfoMutation,
      updateLocalisationMutation,
    ],
  );

  return (
    <div className="grid max-w-[580px] grid-cols-1fr/auto">
      <div className="">
        <form className="grid gap-y-7" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-y-2">
            <Typography variant={TYPOGRAPHY.H7} className="text-gray-900">
              Basic (Localised)
            </Typography>
            {isDirty && (
              <Typography
                variant={TYPOGRAPHY.R4}
                className="text-system-error-500"
              >
                Warning: You have unsaved changes
              </Typography>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {appMetaData.supported_languages?.map((lang, index) => {
              const language = languageMap[lang as keyof typeof languageMap];
              return (
                <CountryBadge
                  key={index}
                  onClick={() => updateLocalisation(lang)}
                  focused={locale === lang}
                >
                  <Image
                    width={20}
                    height={20}
                    className="size-5"
                    src={`${process.env.NEXT_PUBLIC_APP_URL}/icons/flags/${language.country_code}.svg`}
                    alt={`lang flag`}
                  />
                  <Typography variant={TYPOGRAPHY.R5}>
                    {language.label}
                  </Typography>
                </CountryBadge>
              );
            })}
            <CountryBadge
              onClick={() =>
                router.push(urls.setup({ team_id: teamId, app_id: appId }))
              }
              className={clsx({ hidden: !isEditable })}
            >
              <PlusCircleIcon className="size-5 text-gray-300" />
              <Typography variant={TYPOGRAPHY.R5}>Add translation</Typography>
            </CountryBadge>
          </div>
          <Controller
            name="category"
            control={control}
            render={({ field }) => {
              return (
                <CategorySelector
                  value={field.value}
                  required
                  disabled={
                    !isEditable || !isEnoughPermissions || locale !== "en"
                  }
                  onChange={field.onChange}
                  errors={errors.category}
                  label="Category"
                />
              );
            }}
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
            errors={errors.name}
            label="Short name"
            disabled={!isEditable || !isEnoughPermissions}
            required
            placeholder="Enter your short app name"
            maxLength={10}
            addOnRight={
              <RemainingCharacters text={watch("short_name")} maxChars={10} />
            }
          />

          <Input
            register={register("world_app_description")}
            errors={errors.name}
            label="Annotation"
            disabled={!isEditable || !isEnoughPermissions}
            required
            placeholder="Short description for display in the app"
            maxLength={35}
            addOnRight={
              <RemainingCharacters
                text={watch("world_app_description")}
                maxChars={35}
              />
            }
          />

          <Input
            register={register("world_app_button_text")}
            errors={errors.name}
            label="World App Button"
            disabled={!isEditable || !isEnoughPermissions}
            required
            placeholder="Enter your custom button text"
            maxLength={25}
            addOnRight={
              <RemainingCharacters
                text={watch("world_app_button_text")}
                maxChars={25}
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

          <TextArea
            label="How it works"
            rows={5}
            maxLength={1500}
            errors={errors.description_how_it_works}
            disabled={!isEditable || !isEnoughPermissions}
            addOn={
              <RemainingCharacters
                text={watch("description_how_it_works")}
                maxChars={1500}
              />
            }
            placeholder="How do users interact with World ID in your app?"
            register={register("description_how_it_works")}
          />

          <TextArea
            label="How to connect"
            rows={5}
            maxLength={1500}
            errors={errors.description_connect}
            disabled={!isEditable || !isEnoughPermissions}
            placeholder="Explain any setup users need to complete before using World ID with this app."
            register={register("description_connect")}
            addOn={
              <RemainingCharacters
                text={watch("description_connect")}
                maxChars={1500}
              />
            }
          />

          <Input
            label="Try it out"
            required
            errors={errors.integration_url}
            disabled={!isEditable || !isEnoughPermissions || locale !== "en"}
            placeholder="https://"
            register={register("integration_url")}
          />

          <Input
            label="Official website"
            errors={errors.app_website_url}
            required
            disabled={!isEditable || !isEnoughPermissions || locale !== "en"}
            placeholder="https://"
            register={register("app_website_url")}
          />

          <Input
            label="ID"
            disabled
            placeholder={appId}
            addOnRight={<CopyButton fieldName="App ID" fieldValue={appId} />}
          />

          <Input label="Publisher" disabled placeholder={teamName} />

          <DecoratedButton
            type="submit"
            variant="primary"
            className=" mr-5 h-12 w-40"
            disabled={
              !isEditable || !isEnoughPermissions || !isDirty || !isValid
            }
          >
            <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
          </DecoratedButton>
        </form>
      </div>
    </div>
  );
};
