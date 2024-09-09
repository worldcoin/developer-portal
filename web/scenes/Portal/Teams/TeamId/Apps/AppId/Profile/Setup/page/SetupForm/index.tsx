"use client";
import { Checkbox } from "@/components/Checkbox";
import { DecoratedButton } from "@/components/DecoratedButton";
import { OptimismIcon } from "@/components/Icons/OptimismIcon";
import { Input } from "@/components/Input";
import { Radio } from "@/components/Radio";
import { SelectMultiple } from "@/components/SelectMultiple";
import { SwitcherBox } from "@/components/SwitcherBox";
import { TextArea } from "@/components/TextArea";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { formCountriesList, formLanguagesList } from "@/lib/languages";
import { Auth0SessionUser } from "@/lib/types";
import {
  checkUserPermissions,
  convertArrayToHasuraArray,
  formatMultipleStringInput,
} from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import Image from "next/image";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../../graphql/client/fetch-app-metadata.generated";
import { useUpdateSetupMutation } from "./graphql/client/update-setup.generated";

const formatEmailLink = (email: string | undefined) => {
  if (!email) return;
  if (email.startsWith("mailto:")) {
    return email;
  }
  return `mailto:${email}`;
};

const schema = yup.object().shape({
  app_mode: yup.boolean().required("This field is required"),
  whitelisted_addresses: yup.string().nullable(),
  is_whitelist_disabled: yup.boolean(),
  status: yup.boolean().optional(),
  support_link: yup.string().url("Invalid URL"),
  support_email: yup.string().email("Invalid email address"),
  supported_countries: yup
    .array(
      yup
        .string()
        .required("This field is required")
        .length(2, "Invalid country code"),
    )
    .min(1, "This field is required")
    .required("This field is required")
    .default([]),
  supported_languages: yup
    .array(yup.string().required("This field is required"))
    .min(1, "This field is required")
    .required("This field is required")
    .default(["en"])
    .test("has-english", "English is a required language", (langs) =>
      langs.includes("en"),
    ),
  associated_domains: yup
    .string()
    .test(
      "is-valid-https-url-list",
      "Each value must be a valid HTTPS URL",
      function (value) {
        if (!value) return true;

        const domains = value.split(",").map((domain) => domain.trim());
        const httpsUrlRegex = /^https:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
        return domains.every((domain) => httpsUrlRegex.test(domain));
      },
    )
    .nullable(),
  contracts: yup.string().nullable(),
  permit2_tokens: yup.string().nullable(),
});

type LinksFormValues = yup.Asserts<typeof schema>;

type LinksFormProps = {
  appId: string;
  teamId: string;
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  status?: string;
};

export const SetupForm = (props: LinksFormProps) => {
  const countries = useMemo(() => formCountriesList(), []);
  const languages = useMemo(() => formLanguagesList(), []);
  const { appId, teamId, appMetadata, status } = props;
  const { user } = useUser() as Auth0SessionUser;
  const isEditable = appMetadata?.verification_status === "unverified";

  const [isSupportEmail, setIsSupportEmail] = useState(
    appMetadata?.support_link?.startsWith("mailto:") ?? false,
  );

  const [updateSetupMutation, { loading: updatingInfo }] =
    useUpdateSetupMutation();

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
      status: status === "active",
      app_mode: appMetadata?.app_mode === "mini-app" ? true : false,
      support_link: appMetadata?.support_link.includes("https://")
        ? appMetadata?.support_link
        : undefined,
      support_email: appMetadata?.support_link.includes("@")
        ? appMetadata?.support_link.replace("mailto:", "")
        : undefined,
      supported_countries: appMetadata?.supported_countries ?? [],
      supported_languages: appMetadata?.supported_languages ?? [],
      is_whitelist_disabled: !Boolean(appMetadata?.whitelisted_addresses),
      associated_domains: appMetadata?.associated_domains?.join(",") ?? null,
      contracts: appMetadata?.contracts?.join(",") ?? null,
      permit2_tokens: appMetadata?.permit2_tokens?.join(",") ?? null,
    },
  });

  // Used to update the fields when view mode is change
  useEffect(() => {
    reset({
      whitelisted_addresses:
        appMetadata?.whitelisted_addresses?.join(",") ?? null,
      app_mode: appMetadata?.app_mode === "mini-app" ? true : false,
      support_link: appMetadata?.support_link.includes("https://")
        ? appMetadata?.support_link
        : "",
      support_email: appMetadata?.support_link.includes("@")
        ? appMetadata?.support_link.replace("mailto:", "")
        : "",
      supported_countries: appMetadata?.supported_countries ?? [],
      supported_languages: appMetadata?.supported_languages ?? [],
      is_whitelist_disabled: !Boolean(appMetadata?.whitelisted_addresses),
      associated_domains: appMetadata?.associated_domains?.join(",") ?? null,
      status: status === "active",
      contracts: appMetadata?.contracts?.join(",") ?? null,
      permit2_tokens: appMetadata?.permit2_tokens?.join(",") ?? null,
    });
  }, [
    reset,
    appMetadata?.whitelisted_addresses,
    appMetadata?.app_mode,
    appMetadata?.support_link,
    appMetadata?.supported_countries,
    appMetadata?.supported_languages,
    appMetadata?.associated_domains,
    appMetadata?.contracts,
    appMetadata?.permit2_tokens,
    status,
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

        const { status } = values;

        const supported_countries =
          values.supported_countries && values.supported_countries.length > 0
            ? convertArrayToHasuraArray(values.supported_countries)
            : null;

        const supported_languages =
          values.supported_languages && values.supported_languages.length > 0
            ? convertArrayToHasuraArray(values.supported_languages)
            : null;

        const associated_domains =
          values.associated_domains && values.associated_domains.length > 0
            ? formatMultipleStringInput(values.associated_domains)
            : null;

        const contracts =
          values.contracts && values.contracts.length > 0
            ? formatMultipleStringInput(values.contracts)
            : null;

        const permit2_tokens =
          values.permit2_tokens && values.permit2_tokens.length > 0
            ? formatMultipleStringInput(values.permit2_tokens)
            : null;

        // If the user disabled the whitelist, we should set the whitelisted_addresses to null
        const whitelistedAddresses = values.is_whitelist_disabled
          ? null
          : formatMultipleStringInput(values.whitelisted_addresses);

        const supportLink = isSupportEmail
          ? formatEmailLink(values.support_email)
          : values.support_link;

        const result = await updateSetupMutation({
          variables: {
            app_metadata_id: appMetadata?.id ?? "",
            app_id: appId,
            whitelisted_addresses: whitelistedAddresses,
            app_mode: values.app_mode ? "mini-app" : "external",
            support_link: supportLink,
            supported_countries,
            supported_languages,
            associated_domains,
            contracts,
            permit2_tokens,
            status: status ? "active" : "inactive",
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

    [
      appId,
      appMetadata?.id,
      isSupportEmail,
      setError,
      updateSetupMutation,
      updatingInfo,
    ],
  );

  const formatArrayInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    const inputEvent = e.nativeEvent as InputEvent;

    if (
      inputValue.length > 0 &&
      inputValue[inputValue.length - 1] === "," &&
      inputEvent.inputType !== "deleteContentBackward"
    ) {
      const formattedValue = inputValue
        .split(",")
        .map((domain) => domain.trim())
        .join(", ");

      e.target.value = formattedValue;
    }
  };

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
        <Typography variant={TYPOGRAPHY.H7}>Configuration</Typography>

        {isDirty && (
          <Typography variant={TYPOGRAPHY.R4} className="text-system-error-500">
            Warning: You have unsaved changes
          </Typography>
        )}
      </div>

      <div>
        <Controller
          name="app_mode"
          control={control}
          render={({ field }) => {
            return (
              <SwitcherBox
                status={field.value ?? false}
                setStatus={field.onChange}
                disabled={!isEditable || !isEnoughPermissions}
                title="This is a Mini App"
                className="rounded-t-xl border"
                validToggle="Mini App"
                invalidToggle="External"
              />
            );
          }}
        />
        <Controller
          name="status"
          control={control}
          render={({ field }) => {
            return (
              <SwitcherBox
                status={field.value ?? false}
                setStatus={field.onChange}
                disabled={!isEditable || !isEnoughPermissions}
                title="Enable World ID"
                className="rounded-b-xl border border-t-0"
                validToggle="Enabled"
                invalidToggle="Disabled"
              />
            );
          }}
        />
      </div>

      <div className="grid gap-y-5">
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7}>
            Supported Countries <span className="text-system-error-500">*</span>
          </Typography>
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
          <Typography id="languages" variant={TYPOGRAPHY.H7}>
            Supported Languages <span className="text-system-error-500">*</span>
          </Typography>

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
              disabled={!isEditable || !isEnoughPermissions}
              errors={errors.supported_languages}
              selectAll={() => field.onChange(languages.map((c) => c.value))}
              clearAll={() => field.onChange([])}
              showSelectedList
              searchPlaceholder="Start by typing language..."
            >
              {(item, index) => (
                <SelectMultiple.Item
                  item={item}
                  key={index}
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
          <Typography variant={TYPOGRAPHY.H7}>
            Support <span className="text-system-error-500">*</span>
          </Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Please include a support link where users can reach out to you for
            help. Emails should preceded by mailto:
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
              disabled={!isEditable || !isEnoughPermissions || !isSupportEmail}
              placeholder="address@example.com"
              register={register("support_email")}
              errors={errors.support_email}
              required={appMode}
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
              disabled={!isEditable || !isEnoughPermissions || isSupportEmail}
              placeholder="https://"
              register={register("support_link")}
              errors={errors.support_link}
              required={appMode}
            />
          </div>
        </div>
      </div>
      {/* Associated Domains */}
      <div className={clsx("grid gap-y-4", { hidden: !appMode })}>
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7}>Associated Domains</Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Add additional domains that your Mini App can interact with. All
            other domains will be blocked. You do not need to specify
            subdomains.
          </Typography>
        </div>
        <TextArea
          label="Associated Domains"
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="https://example.com, https://example2.com"
          register={register("associated_domains", {
            onChange: formatArrayInput,
          })}
          enableResize={false}
          errors={errors.associated_domains}
        />
      </div>

      {/* Whitelist */}
      <div className={clsx("grid gap-y-4", { hidden: !appMode })}>
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
          <TextArea
            label="Whitelisted Payment Addresses"
            disabled={
              !isEditable ||
              !isEnoughPermissions ||
              isWhitelistDisabled ||
              !appMode
            }
            placeholder="0x12312321..., 0x12312312..."
            register={register("whitelisted_addresses", {
              onChange: formatArrayInput,
            })}
            enableResize={false}
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

      <hr className={clsx({ hidden: !appMode })} />

      <div className={clsx("grid grid-cols-1", { hidden: !appMode })}>
        <Typography variant={TYPOGRAPHY.H6}>
          Smart Contract Configuration
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          These configurations are required for your Mini App to interact with
          world chain. If you are not using smart contracts, you can skip this
          section.
        </Typography>
      </div>

      {/* Permit2 Tokens */}
      <div className={clsx("grid gap-y-4", { hidden: !appMode })}>
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7}>Permit2 Tokens</Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            List all the tokens that you intend to use in your Mini App. Any
            other tokens will be blocked.
          </Typography>
        </div>
        <TextArea
          label="Permit2 Tokens"
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="0xad312321..., 0xE901e312..."
          register={register("permit2_tokens", { onChange: formatArrayInput })}
          enableResize={false}
        />
      </div>

      {/* Contracts */}
      <div className={clsx("grid gap-y-4", { hidden: !appMode })}>
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7}>Contract Entrypoints</Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            List here contracts that you intend to call functions directly on.
          </Typography>
        </div>
        <TextArea
          label="Contract Entrypoints"
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="0xb731d321..., 0xF2310312..."
          register={register("contracts", { onChange: formatArrayInput })}
          enableResize={false}
        />
      </div>
      <DecoratedButton
        type="submit"
        className="h-12 w-40"
        disabled={!isEditable || !isEnoughPermissions || !isValid}
      >
        <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
      </DecoratedButton>
    </form>
  );
};
