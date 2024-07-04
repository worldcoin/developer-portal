"use client";
import { Checkbox } from "@/components/Checkbox";
import { DecoratedButton } from "@/components/DecoratedButton";
import { OptimismIcon } from "@/components/Icons/OptimismIcon";
import { Input } from "@/components/Input";
import { SelectMultiple } from "@/components/SelectMultiple";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import {
  checkUserPermissions,
  convertArrayToHasuraArray,
  formatWhiteListedAddresses,
} from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import Image from "next/image";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../../graphql/client/fetch-app-metadata.generated";
import {
  formCountriesList,
  formLanguagesList,
} from "../helpers/form-countries-list";
import { useUpdateMiniAppInfoMutation } from "./graphql/client/update-mini-app.generated";

const urlRegex = /^(https:\/\/|mailto:)/;

const schema = yup.object().shape({
  app_mode: yup.boolean().required("This field is required"),
  // If the whitelist is null then the it is considered disabled
  whitelisted_addresses: yup.string().nullable(),
  is_whitelist_disabled: yup.boolean(),
  support_link: yup.string().when("app_mode", {
    is: true,
    then: (schema) =>
      schema.matches(urlRegex, "URL must start with https:// or mailto:"),
  }),

  supported_countries: yup.array().when("app_mode", {
    is: true,
    then: (schema) =>
      schema
        .of(
          yup
            .string()
            .required("This field is required")
            .length(2, "Invalid country code"),
        )
        .min(1, "This field is required for Mini Apps")
        .required("This field is required")
        .default([]),
    otherwise: (schema) => schema.notRequired().default(null),
  }),

  supported_languages: yup.array().when("app_mode", {
    is: true,
    then: (schema) =>
      schema
        .of(yup.string().required("This field is required"))
        .min(1, "This field is required for Mini Apps")
        .required("This field is required")
        .default([]),
    otherwise: (schema) => schema.notRequired().default(null),
  }),
});

type LinksFormValues = yup.Asserts<typeof schema>;

type LinksFormProps = {
  appId: string;
  teamId: string;
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
};

export const MiniAppForm = (props: LinksFormProps) => {
  const countries = useMemo(() => formCountriesList(), []);
  const languages = useMemo(() => formLanguagesList(), []);
  const { appId, teamId, appMetadata } = props;
  const { user } = useUser() as Auth0SessionUser;
  const isEditable = appMetadata?.verification_status === "unverified";

  const [updateMiniAppInfoMutation, { loading: updatingInfo }] =
    useUpdateMiniAppInfoMutation();

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
    setError,
    control,
  } = useForm<LinksFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",

    defaultValues: {
      whitelisted_addresses:
        appMetadata?.whitelisted_addresses?.join(",") ?? null,
      app_mode: appMetadata?.app_mode === "mini-app" ? true : false,
      support_link: appMetadata?.support_link ?? undefined,
      supported_countries: appMetadata?.supported_countries ?? [],
      supported_languages: appMetadata?.supported_languages ?? [],
      is_whitelist_disabled: !Boolean(appMetadata?.whitelisted_addresses),
    },
  });

  // Used to update the fields when view mode is change
  useEffect(() => {
    reset({
      whitelisted_addresses:
        appMetadata?.whitelisted_addresses?.join(",") ?? null,
      app_mode: appMetadata?.app_mode === "mini-app" ? true : false,
      support_link: appMetadata?.support_link ?? undefined,
      supported_countries: appMetadata?.supported_countries ?? [],
      supported_languages: appMetadata?.supported_languages ?? [],
      is_whitelist_disabled: !Boolean(appMetadata?.whitelisted_addresses),
    });
  }, [
    reset,
    appMetadata?.whitelisted_addresses,
    appMetadata?.app_mode,
    appMetadata?.support_link,
    appMetadata?.supported_countries,
    appMetadata?.supported_languages,
  ]);

  const submit = useCallback(
    async (values: LinksFormValues) => {
      if (updatingInfo) return;
      try {
        // Check if app_mode is true and whitelisted_addresses is not provided or empty
        if (
          values.app_mode &&
          !values.is_whitelist_disabled &&
          (!values.whitelisted_addresses ||
            values.whitelisted_addresses.length === 0)
        ) {
          setError("whitelisted_addresses", {
            type: "manual",
            message:
              "Mini Apps must have at least one whitelisted payment address.",
          });
          throw new Error(
            "Mini Apps must have at least one whitelisted payment address.",
          );
        }

        const supported_countries =
          values.supported_countries && values.supported_countries.length > 0
            ? convertArrayToHasuraArray(values.supported_countries)
            : null;

        const supported_languages =
          values.supported_languages && values.supported_languages.length > 0
            ? convertArrayToHasuraArray(values.supported_languages)
            : null;

        // If the user disabled the whitelist, we should set the whitelisted_addresses to null
        const whitelistedAddresses = values.is_whitelist_disabled
          ? null
          : formatWhiteListedAddresses(values.whitelisted_addresses);

        const result = await updateMiniAppInfoMutation({
          variables: {
            app_metadata_id: appMetadata?.id ?? "",
            whitelisted_addresses: whitelistedAddresses,
            app_mode: values.app_mode ? "mini-app" : "external",
            support_link: values.support_link || null,
            supported_countries,
            supported_languages,
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

        if (result instanceof Error) {
          throw result;
        }

        toast.success("App information updated successfully");
      } catch (e) {
        console.error("Mini App Data Failed to Update: ", e);
        toast.error("Failed to update app information");
      }
    },

    [appId, appMetadata?.id, setError, updateMiniAppInfoMutation, updatingInfo],
  );

  const selectedCountries = useWatch({
    control,
    name: "supported_countries",
  });

  const appMode = useWatch({
    control,
    name: "app_mode",
  });

  const isWhitelistDisabled = useWatch({
    control,
    name: "is_whitelist_disabled",
  });

  return (
    <form className="grid gap-y-9" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H7}>Mini App Configuration</Typography>

        {isDirty && (
          <Typography variant={TYPOGRAPHY.R4} className="text-system-error-500">
            Warning: You have unsaved changes
          </Typography>
        )}
      </div>

      <label
        htmlFor="app_mode"
        className="grid cursor-pointer grid-cols-auto/1fr gap-x-4 rounded-xl border-[1px] border-grey-200 px-5 py-6"
      >
        <Checkbox
          id="app_mode"
          register={register("app_mode")}
          disabled={!isEditable || !isEnoughPermissions}
        />

        <div className="grid gap-y-2">
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
            This is a Mini App
          </Typography>

          <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
            Check this if you have integrated mini-kit into your app and want it
            to load as a mini-app. Your app will be rejected if this is not
            true.
          </Typography>
        </div>
      </label>

      <div className="grid gap-y-4">
        <div className="grid gap-y-5">
          <div className="grid gap-y-3">
            <div className="flex flex-row gap-x-2">
              <OptimismIcon />
              <Typography variant={TYPOGRAPHY.H7} className="text-center">
                Whitelisted Payment Addresses
              </Typography>
            </div>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              These addresses are authorised to receive payments for your mini
              app. Payment requests to other addresses will be rejected. <br />
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R3}
              className={clsx("text-system-warning-500", {
                hidden: !isWhitelistDisabled || !appMode,
              })}
            >
              Warning: Disabling the whitelist removes protection from payments
              to invalid addresses.
            </Typography>
          </div>
          <Input
            label="Whitelisted Payment Addresses"
            disabled={
              !isEditable ||
              !isEnoughPermissions ||
              isWhitelistDisabled ||
              !appMode
            }
            placeholder="0x12312321..., 0x12312312..."
            register={register("whitelisted_addresses")}
          />
        </div>

        {errors?.whitelisted_addresses?.message && (
          <p className="mt-2 text-xs text-system-error-500">
            {errors?.whitelisted_addresses?.message}
          </p>
        )}
        <label
          htmlFor="is_whitelist_disabled"
          className="grid w-fit cursor-pointer grid-cols-auto/1fr gap-x-4  border-grey-200 py-1"
        >
          <Checkbox
            id="is_whitelist_disabled"
            register={register("is_whitelist_disabled")}
            disabled={!isEditable || !isEnoughPermissions || !appMode}
          />

          <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
            Disable whitelist
          </Typography>
        </label>
      </div>

      <div className="grid gap-y-5">
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7}>Supported Countries</Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Select a list of countries where Mini App will be available
          </Typography>
        </div>
        <Controller
          control={control}
          name="supported_countries"
          render={({ field }) => (
            <SelectMultiple
              values={selectedCountries}
              onRemove={(value) =>
                field.onChange(field.value?.filter((v) => v !== value) ?? [])
              }
              items={countries}
              label=""
              disabled={!isEditable || !isEnoughPermissions || !appMode}
              errors={errors.supported_countries}
              required={appMode}
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
                  item={item}
                  index={index}
                  checked={selectedCountries?.includes(item.value)}
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
          <Typography variant={TYPOGRAPHY.H7}>Supported Languages</Typography>

          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Select a list of languages your Mini App supports
          </Typography>
        </div>
        <Controller
          control={control}
          name="supported_languages"
          render={({ field }) => (
            <SelectMultiple
              values={field.value}
              onRemove={(value) =>
                field.onChange(field.value?.filter((v) => v !== value) ?? [])
              }
              items={languages}
              label=""
              disabled={!isEditable || !isEnoughPermissions || !appMode}
              errors={errors.supported_languages}
              required={appMode}
              selectAll={() => field.onChange(languages.map((c) => c.value))}
              clearAll={() => field.onChange([])}
              showSelectedList
              searchPlaceholder="Start by typing language..."
            >
              {(item, index) => (
                <SelectMultiple.Item
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
          <Typography variant={TYPOGRAPHY.H7}>Support</Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Please include a support link where users can reach out to you for
            help. Emails should preceded by mailto:
          </Typography>
        </div>
        {/* Pending designs change this to a switcher */}
        <Input
          label="Support Link"
          disabled={!isEditable || !isEnoughPermissions || !appMode}
          placeholder="mailto:address@example.com"
          register={register("support_link")}
          errors={errors.support_link}
          required={appMode}
        />
      </div>

      <DecoratedButton
        type="submit"
        className="h-12 w-40"
        disabled={!isEditable || !isEnoughPermissions || !isDirty || !isValid}
      >
        <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
      </DecoratedButton>
    </form>
  );
};
