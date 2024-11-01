"use client";
import { Checkbox } from "@/components/Checkbox";
import { DecoratedButton } from "@/components/DecoratedButton";
import { WLDIcon } from "@/components/Icons/WLDIcon";
import { TextArea } from "@/components/TextArea";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions, formatMultipleStringInput } from "@/lib/utils";
import { RadioCard } from "@/scenes/Portal/layout/CreateAppDialog/RadioCard";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { ChangeEvent, useCallback, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../../graphql/client/fetch-app-metadata.generated";
import { useUpdateSetupMutation } from "./graphql/client/update-setup.generated";

const schema = yup.object().shape({
  app_mode: yup.string().required(),
  whitelisted_addresses: yup.string().nullable(),
  is_whitelist_disabled: yup.boolean(),
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
  canImportAllContacts: yup.boolean().optional(),
});

type LinksFormValues = yup.Asserts<typeof schema>;

type LinksFormProps = {
  appId: string;
  teamId: string;
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
};

export const SetupForm = (props: LinksFormProps) => {
  const { appId, teamId, appMetadata } = props;
  const { user } = useUser() as Auth0SessionUser;
  const isEditable = appMetadata?.verification_status === "unverified";

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
      app_mode: appMetadata?.app_mode,
      is_whitelist_disabled: !Boolean(appMetadata?.whitelisted_addresses),
      associated_domains: appMetadata?.associated_domains?.join(",") ?? null,
      contracts: appMetadata?.contracts?.join(",") ?? null,
      permit2_tokens: appMetadata?.permit2_tokens?.join(",") ?? null,
      canImportAllContacts: appMetadata?.canImportAllContacts ?? false,
    },
  });

  // Used to update the fields when view mode is change
  useEffect(() => {
    reset({
      whitelisted_addresses:
        appMetadata?.whitelisted_addresses?.join(",") ?? null,
      app_mode: appMetadata?.app_mode,
      is_whitelist_disabled: !Boolean(appMetadata?.whitelisted_addresses),
      associated_domains: appMetadata?.associated_domains?.join(",") ?? null,
      contracts: appMetadata?.contracts?.join(",") ?? null,
      permit2_tokens: appMetadata?.permit2_tokens?.join(",") ?? null,
      canImportAllContacts: appMetadata?.canImportAllContacts ?? false,
    });
  }, [
    reset,
    appMetadata?.whitelisted_addresses,
    appMetadata?.app_mode,
    appMetadata?.associated_domains,
    appMetadata?.contracts,
    appMetadata?.permit2_tokens,
    appMetadata?.canImportAllContacts,
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

        const result = await updateSetupMutation({
          variables: {
            app_metadata_id: appMetadata?.id ?? "",
            whitelisted_addresses: whitelistedAddresses,
            app_mode: values.app_mode,
            associated_domains,
            contracts,
            permit2_tokens,
            canImportAllContacts: values.canImportAllContacts,
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

    [appId, appMetadata?.id, setError, updateSetupMutation, updatingInfo],
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
        <Typography variant={TYPOGRAPHY.H7}>Advanced Settings</Typography>

        {isDirty && (
          <Typography variant={TYPOGRAPHY.R4} className="text-system-error-500">
            Warning: You have unsaved changes
          </Typography>
        )}
      </div>

      <div className="grid gap-y-6">
        <div className="grid gap-2 md:grid-cols-2">
          <RadioCard
            register={register("app_mode")}
            option={{ value: "mini-app", label: "Mini App" }}
            description={`Create a mini app that runs inside the World App.`}
          />

          <RadioCard
            register={register("app_mode")}
            option={{ value: "external", label: "External" }}
            description="Create a World ID app that runs outside the World App."
          />
        </div>
      </div>

      {/* Associated Domains */}
      <div className={clsx("grid gap-y-4", { hidden: appMode == "external" })}>
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7}>Additional Domains</Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Add additional domains that your Mini App can interact with. All
            other domains will be blocked. You do not need to specify
            subdomains.
          </Typography>
        </div>
        <TextArea
          label="Additional Domains"
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
      <div className={clsx("grid gap-y-4", { hidden: appMode == "external" })}>
        <div className="grid gap-y-5">
          <div className="grid gap-y-3">
            <div className="flex flex-row gap-x-2">
              <WLDIcon />
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
                hidden: !isWhitelistDisabled || appMode == "external",
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
              appMode == "external"
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
            disabled={
              !isEditable || !isEnoughPermissions || appMode == "external"
            }
          />

          <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
            Disable whitelist
          </Typography>
        </label>
      </div>

      {/* Permit2 Tokens */}
      <div className={clsx("grid gap-y-4", { hidden: appMode == "external" })}>
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
      <div className={clsx("grid gap-y-4", { hidden: appMode == "external" })}>
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
