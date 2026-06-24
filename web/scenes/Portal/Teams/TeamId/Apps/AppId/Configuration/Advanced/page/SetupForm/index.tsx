"use client";
import { Checkbox } from "@/components/Checkbox";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { WLDIcon } from "@/components/Icons/WLDIcon";
import { Link } from "@/components/Link";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { TextArea } from "@/components/TextArea";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AppMode } from "@/lib/constants";
import { useTeamPermission } from "@/lib/team-permissions/use-team-permission";
import { RadioCard } from "@/scenes/Portal/layout/CreateAppDialog/RadioCard";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FetchAppMetadataQuery } from "../../../graphql/client/fetch-app-metadata.generated";
import { useAutosaveWithStatus } from "../../../hook/use-autosave-with-status";
import { useSaveStatus } from "../../../SaveStatus";
import {
  updateSetupInitialSchema,
  UpdateSetupInitialSchema,
} from "../form-schema";
import { validateAndUpdateSetupServerSide } from "../server/submit";

type LinksFormProps = {
  appId: string;
  teamId: string;
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
};
const maxNotificationPerDayDropdownOptions = [
  { value: 0, label: "0" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: "unlimited", label: "Unlimited" },
] as const;

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

// calculate dynamic rows based on content
const calculateRows = (
  value: string | null | undefined,
  minRows = 3,
  maxRows = 10,
) => {
  if (!value) return minRows;

  const lines = value.split(",").length;

  return Math.max(minRows, Math.min(maxRows, lines + 1));
};

export const SetupForm = (props: LinksFormProps) => {
  const { teamId, appMetadata } = props;
  const isEditable = appMetadata?.verification_status === "unverified";
  const editStorePerm = useTeamPermission(teamId, "edit_app_store_details");

  const form = useForm<UpdateSetupInitialSchema>({
    resolver: yupResolver(updateSetupInitialSchema),
    mode: "onChange",

    defaultValues: {
      whitelisted_addresses:
        appMetadata?.whitelisted_addresses?.join(",") ?? null,
      app_mode: appMetadata?.app_mode as keyof typeof AppMode,
      is_whitelist_disabled: !Boolean(appMetadata?.whitelisted_addresses),
      associated_domains: appMetadata?.associated_domains?.join(",") ?? null,
      contracts: appMetadata?.contracts?.join(",") ?? null,
      permit2_tokens: appMetadata?.permit2_tokens?.join(",") ?? null,
      can_import_all_contacts: appMetadata?.can_import_all_contacts,
      can_use_attestation: appMetadata?.can_use_attestation,
      max_notifications_per_day: Number(appMetadata?.max_notifications_per_day),
      is_allowed_unlimited_notifications: Boolean(
        appMetadata?.is_allowed_unlimited_notifications,
      ),
    },
  });
  const {
    register,
    reset,
    formState: { errors, dirtyFields },
    setError,
    control,
  } = form;

  // Reset only when the underlying metadata row changes (e.g. version
  // switch), never on cache updates that happen while the user is mid-edit.
  // Without this gate, autosave's post-save refetch could land while the
  // user keeps typing and reset() would revert the in-flight local edit.
  const previousMetadataIdRef = useRef(appMetadata?.id);
  useEffect(() => {
    if (previousMetadataIdRef.current !== appMetadata?.id) {
      reset({
        whitelisted_addresses:
          appMetadata?.whitelisted_addresses?.join(",") ?? null,
        app_mode: appMetadata?.app_mode as keyof typeof AppMode,
        is_whitelist_disabled: !Boolean(appMetadata?.whitelisted_addresses),
        associated_domains: appMetadata?.associated_domains?.join(",") ?? null,
        contracts: appMetadata?.contracts?.join(",") ?? null,
        permit2_tokens: appMetadata?.permit2_tokens?.join(",") ?? null,
        can_import_all_contacts: appMetadata?.can_import_all_contacts,
        can_use_attestation: appMetadata?.can_use_attestation,
        max_notifications_per_day: Number(
          appMetadata?.max_notifications_per_day,
        ),
        is_allowed_unlimited_notifications: Boolean(
          appMetadata?.is_allowed_unlimited_notifications,
        ),
      });
      previousMetadataIdRef.current = appMetadata?.id;
    }
  }, [appMetadata, reset]);

  const persist = useCallback(
    async (values: UpdateSetupInitialSchema, signal?: AbortSignal) => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const result = await validateAndUpdateSetupServerSide(
        values,
        appMetadata?.id ?? "",
      );
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (!result.success) {
        throw new Error(result.message);
      }
      // Don't refetch — autosave's local form state is the source of truth
      // for fields the user just typed. A refetch after every save would
      // race with continued typing and the auto-reset above (when ungated)
      // would clobber in-flight edits. None of the persisted fields are
      // displayed elsewhere on this page, so skipping the refetch is safe.
    },
    [appMetadata?.id],
  );

  const isAdvancedEditable = isEditable && editStorePerm.allowed;

  const hasInvalidWhitelistCombination = (values: UpdateSetupInitialSchema) =>
    values.app_mode === "mini-app" &&
    !values.is_whitelist_disabled &&
    (!values.whitelisted_addresses ||
      values.whitelisted_addresses.length === 0);

  useAutosaveWithStatus<UpdateSetupInitialSchema>({
    id: "advanced-setup",
    form,
    enabled: isAdvancedEditable,
    save: async (values, signal) => {
      if (hasInvalidWhitelistCombination(values)) {
        setError("whitelisted_addresses", {
          type: "manual",
          message:
            "Mini Apps must have at least one whitelisted payment address.",
        });
        throw new Error(
          "Mini Apps must have at least one whitelisted payment address.",
        );
      }
      await persist(values, signal);
    },
  });

  const { flushAll, displayStatus } = useSaveStatus();

  const appMode = useWatch({
    control,
    name: "app_mode",
  });

  const isWhitelistDisabled = useWatch({
    control,
    name: "is_whitelist_disabled",
  });

  // watch form values for dynamic row calculation
  const watchedValues = useWatch({
    control,
    name: [
      "associated_domains",
      "whitelisted_addresses",
      "permit2_tokens",
      "contracts",
    ],
  });

  const [associatedDomains, whitelistedAddresses, permit2Tokens, contracts] =
    watchedValues;

  return (
    <form
      className="grid gap-y-9"
      onSubmit={(event) => {
        event.preventDefault();
        void flushAll();
      }}
    >
      <Typography variant={TYPOGRAPHY.H7}>Advanced Settings</Typography>

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
          aria-label="Additional Domains"
          disabled={!isEditable || !editStorePerm.allowed}
          placeholder="https://example.com, https://example2.com"
          register={register("associated_domains", {
            onChange: formatArrayInput,
          })}
          enableResize={false}
          rows={calculateRows(associatedDomains)}
          className="max-h-64 min-h-32"
          errors={errors.associated_domains}
        />
      </div>

      {/* Whitelist */}
      <div className={clsx("grid gap-y-4", { hidden: appMode == "external" })}>
        <div className="grid gap-y-5">
          <div className="grid gap-y-3">
            <div className="flex flex-row gap-x-2">
              <WLDIcon className="pb-1" />
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
              !editStorePerm.allowed ||
              isWhitelistDisabled ||
              appMode == "external"
            }
            placeholder="0x12312321..., 0x12312312..."
            register={register("whitelisted_addresses", {
              onChange: formatArrayInput,
            })}
            enableResize={false}
            rows={calculateRows(whitelistedAddresses)}
            className="max-h-64 min-h-32"
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
              !isEditable || !editStorePerm.allowed || appMode == "external"
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
          disabled={!isEditable || !editStorePerm.allowed}
          placeholder="0xad312321..., 0xE901e312..."
          register={register("permit2_tokens", { onChange: formatArrayInput })}
          enableResize={false}
          rows={calculateRows(permit2Tokens)}
          className="max-h-64 min-h-32"
        />
        {errors?.permit2_tokens?.message && (
          <p className="mt-2 text-xs text-system-error-500">
            {errors?.permit2_tokens?.message}
          </p>
        )}
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
          disabled={!isEditable || !editStorePerm.allowed}
          placeholder="0xb731d321..., 0xF2310312..."
          register={register("contracts", { onChange: formatArrayInput })}
          enableResize={false}
          rows={calculateRows(contracts)}
          className="max-h-64 min-h-32"
        />
        {errors?.contracts?.message && (
          <p className="mt-2 text-xs text-system-error-500">
            {errors?.contracts?.message}
          </p>
        )}
      </div>

      {/* Permissions */}
      <div className={clsx("grid gap-y-4", { hidden: appMode == "external" })}>
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7}>Permissions</Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Request permissions to access notifications or contacts.
          </Typography>
          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-system-warning-500"
          >
            Warning: Unlimited notifications are very rarely granted and will be
            rejected most of the time. Refer to{" "}
            <Link
              className="font-bold underline"
              href="https://docs.world.org/mini-apps/notifications/how-to-send-notifications"
            >
              docs
            </Link>{" "}
            for guidelines.
          </Typography>
        </div>
        <Typography variant={TYPOGRAPHY.R3}>
          Select your desired maximum notifications per day
        </Typography>
        <Controller
          name="max_notifications_per_day"
          control={control}
          render={({ field }) => {
            return (
              <Select
                value={
                  !dirtyFields.max_notifications_per_day &&
                  appMetadata?.is_allowed_unlimited_notifications
                    ? "unlimited"
                    : field.value
                }
                onChange={field.onChange}
                disabled={!isEditable || !editStorePerm.allowed}
              >
                <SelectButton className="min-w-[150px] rounded-lg border border-grey-200 px-4 py-2 md:w-fit">
                  {({ value }) => (
                    <div className="grid grid-cols-1fr/auto items-center gap-x-2">
                      <Typography
                        variant={TYPOGRAPHY.R3}
                        className="text-start text-grey-700"
                      >
                        {
                          maxNotificationPerDayDropdownOptions.find(
                            (v) => v.value === value,
                          )?.label
                        }
                      </Typography>
                      <CaretIcon />
                    </div>
                  )}
                </SelectButton>

                <SelectOptions>
                  {maxNotificationPerDayDropdownOptions.map((option, index) => (
                    <SelectOption
                      key={`max-notifications-${option.value}-${index}`}
                      value={option.value}
                    >
                      {option.label}
                    </SelectOption>
                  ))}
                </SelectOptions>
              </Select>
            );
          }}
        />
        {/* <label
          htmlFor="can_import_all_contacts"
          className="grid w-fit cursor-pointer grid-cols-auto/1fr gap-x-4  border-grey-200 py-1"
        >
          <Checkbox
            id="can_import_all_contacts"
            register={register("can_import_all_contacts")}
            disabled={
              !isEditable || !editStorePerm.allowed || appMode === "external"
            }
          />

          <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
            Can import all contacts
          </Typography>
        </label> */}
      </div>
      <DecoratedButton
        type="button"
        className="h-12 w-40"
        disabled={!isAdvancedEditable || displayStatus.state === "saving"}
        onClick={() => {
          void flushAll();
        }}
      >
        <Typography variant={TYPOGRAPHY.M3}>
          {displayStatus.state === "saving" ? "Saving…" : "Save now"}
        </Typography>
      </DecoratedButton>
    </form>
  );
};
