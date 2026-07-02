"use client";

import { Checkbox } from "@/components/Checkbox";
import { DecoratedButton } from "@/components/DecoratedButton";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { Link } from "@/components/Link";
import { TextArea } from "@/components/TextArea";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { AppMode } from "@/lib/constants";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useApolloClient } from "@apollo/client";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useAtom } from "jotai";
import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { QrQuickAction } from "../../Configuration/BasicInformation/QrQuickAction";
import { isMiniAppAtom } from "../../Configuration/layout/ImagesProvider";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import {
  updateSetupInitialSchema,
  UpdateSetupInitialSchema,
} from "../../Configuration/Advanced/page/form-schema";
import { validateAndUpdateSetupServerSide } from "../../Configuration/Advanced/page/server/submit";
import {
  SaveStatusIndicator,
  useSaveStatus,
} from "../../Configuration/SaveStatus";
import { useAutosaveWithStatus } from "../../Configuration/hook/use-autosave-with-status";

type PermissionsFormProps = {
  appId: string;
  teamId: string;
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
};

const maxNotificationPerDayOptions = [0, 1, 2, "unlimited"] as const;

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

const ModeCard = (props: {
  label: string;
  description: string;
  value: keyof typeof AppMode;
  selected: boolean;
  disabled: boolean;
  onSelect: (value: keyof typeof AppMode) => void;
}) => {
  const { label, description, value, selected, disabled, onSelect } = props;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={clsx(
        "flex h-[110px] flex-col items-start gap-3 rounded-[10px] border px-6 py-5 text-left transition-colors",
        "border-grey-100",
        !selected && "hover:border-grey-300",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex w-[234px] items-center justify-between gap-3">
        <Typography variant={TYPOGRAPHY.S2} className="text-grey-900">
          {label}
        </Typography>

        <span
          className={clsx(
            "flex size-5 items-center justify-center rounded-full border-[1.25px]",
            selected
              ? "border-grey-900 bg-grey-900 text-grey-0"
              : "border-grey-200 bg-grey-0",
          )}
          aria-hidden
        >
          {selected && <CheckIcon size="16" className="size-[13px]" />}
        </span>
      </div>

      <Typography variant={TYPOGRAPHY.B3} className="w-[218px] text-[#657080]">
        {description}
      </Typography>
    </button>
  );
};

const InlineWarning = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex h-[72px] items-center gap-x-3 rounded-[10px] bg-system-warning-100 px-5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-warning-600">
        <AlertIcon className="size-4 text-grey-0" />
      </div>
      <Typography variant={TYPOGRAPHY.B3} className="text-system-warning-600">
        {children}
      </Typography>
    </div>
  );
};

const MiniAppQrPanel = ({
  appId,
  appMetadata,
  isMiniApp,
}: {
  appId: string;
  appMetadata: PermissionsFormProps["appMetadata"];
  isMiniApp: boolean;
}) => {
  if (!isMiniApp) {
    return null;
  }

  const showDraftMiniAppFlag = appMetadata?.verification_status !== "verified";
  let miniAppUrl = `https://world.org/mini-app?app_id=${appId}&path=`;

  if (showDraftMiniAppFlag && appMetadata?.id) {
    miniAppUrl += `&draft_id=${appMetadata.id}`;
  }

  return (
    <aside className="lg:sticky lg:top-8">
      {!!appMetadata?.integration_url ? (
        <QrQuickAction
          url={miniAppUrl}
          showDraftMiniAppFlag={showDraftMiniAppFlag}
        />
      ) : (
        <div className="flex items-center gap-3 rounded-[10px] bg-system-warning-100 p-5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-warning-600">
            <AlertIcon className="size-4 text-white" />
          </div>
          <Typography
            variant={TYPOGRAPHY.B3}
            className="flex-1 text-system-warning-600"
          >
            Add a valid App URL and save changes to enable the QR code preview.
          </Typography>
        </div>
      )}
    </aside>
  );
};

const getFormValuesFromMetadata = (
  appMetadata: PermissionsFormProps["appMetadata"],
): UpdateSetupInitialSchema => ({
  whitelisted_addresses: appMetadata?.whitelisted_addresses?.join(",") ?? null,
  app_mode: appMetadata?.app_mode as keyof typeof AppMode,
  is_whitelist_disabled: !Boolean(appMetadata?.whitelisted_addresses),
  associated_domains: appMetadata?.associated_domains?.join(",") ?? null,
  contracts: appMetadata?.contracts?.join(",") ?? null,
  permit2_tokens: appMetadata?.permit2_tokens?.join(",") ?? null,
  can_import_all_contacts: Boolean(appMetadata?.can_import_all_contacts),
  can_use_attestation: Boolean(appMetadata?.can_use_attestation),
  max_notifications_per_day: appMetadata?.is_allowed_unlimited_notifications
    ? "unlimited"
    : Number(appMetadata?.max_notifications_per_day),
  is_allowed_unlimited_notifications: Boolean(
    appMetadata?.is_allowed_unlimited_notifications,
  ),
});

export const SetupForm = ({
  appId,
  teamId,
  appMetadata,
}: PermissionsFormProps) => {
  const { user } = useUser() as Auth0SessionUser;
  const apolloClient = useApolloClient();
  const isEditable = appMetadata?.verification_status === "unverified";

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [teamId, user]);

  const form = useForm<UpdateSetupInitialSchema>({
    resolver: yupResolver(updateSetupInitialSchema),
    mode: "onChange",
    defaultValues: getFormValuesFromMetadata(appMetadata),
  });
  const {
    register,
    reset,
    formState: { errors },
    setError,
    control,
    setValue,
  } = form;

  // Reset only when the underlying app id changes (e.g. version switch),
  // never on cache updates that happen while the user is mid-edit.
  const previousMetadataIdRef = useMemo(
    () => ({ current: appMetadata?.id }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    if (previousMetadataIdRef.current !== appMetadata?.id) {
      reset(getFormValuesFromMetadata(appMetadata));
      previousMetadataIdRef.current = appMetadata?.id;
    }
  }, [appMetadata, reset, previousMetadataIdRef]);

  // Shared source of truth for "is this a mini app" — the same atom the
  // "This is a Mini App" toggle (MiniAppConfiguration, on the Configuration
  // route) writes to. The QR panel and mini-app sections read it so they
  // reveal reliably regardless of which route flipped the mode. We re-seed
  // it from the persisted mode here because that toggle isn't mounted on
  // this route, so the atom could otherwise be stale on direct entry.
  const [isMiniApp, setIsMiniApp] = useAtom(isMiniAppAtom);
  useEffect(() => {
    setIsMiniApp(appMetadata?.app_mode === "mini-app");
  }, [appMetadata?.app_mode, setIsMiniApp]);

  const canEdit = isEditable && isEnoughPermissions;

  const hasInvalidWhitelistCombination = useCallback(
    (values: UpdateSetupInitialSchema) =>
      values.app_mode === "mini-app" &&
      !values.is_whitelist_disabled &&
      (!values.whitelisted_addresses ||
        values.whitelisted_addresses.length === 0),
    [],
  );

  useAutosaveWithStatus<UpdateSetupInitialSchema>({
    id: "mini-app-permissions",
    form,
    enabled: canEdit,
    save: async (values, signal) => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
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
      const result = await validateAndUpdateSetupServerSide(
        values,
        appMetadata?.id ?? "",
      );
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (!result.success) throw new Error(result.message);
      // Patch app_mode into the cache so the QR panel / mini-app sections
      // stay correct on remount and version switches. We skip a full refetch
      // to avoid the cache-driven re-render flicker (the other persisted
      // fields are form-controlled on this page and don't need a cache patch).
      if (appMetadata?.id && values.app_mode) {
        apolloClient.cache.modify({
          id: apolloClient.cache.identify({
            __typename: "app_metadata",
            id: appMetadata.id,
          }),
          fields: {
            app_mode: () => values.app_mode,
          },
        });
      }
    },
  });

  const { flushAll, displayStatus } = useSaveStatus();

  const isWhitelistDisabled = useWatch({
    control,
    name: "is_whitelist_disabled",
  });

  // Mini-app sections + the QR panel read isMiniApp (the shared atom) instead
  // of the local form field so they reveal in lockstep with the toggle.
  const isExternal = !isMiniApp;

  const handleModeSelect = useCallback(
    (value: keyof typeof AppMode) => {
      setIsMiniApp(value === "mini-app");
      setValue("app_mode", value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setIsMiniApp, setValue],
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,580px)_minmax(280px,1fr)] lg:items-start">
      <form
        className="grid max-w-[580px] gap-y-10"
        onSubmit={(event) => {
          event.preventDefault();
          void flushAll();
        }}
      >
        <Typography
          variant={TYPOGRAPHY.H7}
          className="font-normal text-grey-900"
        >
          Advanced settings
        </Typography>

        <div className="grid gap-4 md:grid-cols-2">
          <ModeCard
            label="Mini App"
            description="Create a mini app that runs inside the World App."
            value="mini-app"
            selected={isMiniApp}
            disabled={!canEdit}
            onSelect={handleModeSelect}
          />

          <ModeCard
            label="External"
            description="Create a World ID app that runs outside the World App."
            value="external"
            selected={!isMiniApp}
            disabled={!canEdit}
            onSelect={handleModeSelect}
          />
        </div>

        {!isExternal && <div className="w-full border-t border-grey-100" />}

        {!isExternal && (
          <>
            <div className="grid gap-y-5">
              <div className="grid gap-y-3">
                <Typography
                  variant={TYPOGRAPHY.H7}
                  className="font-normal text-grey-900"
                >
                  Additional Domains
                </Typography>
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                  Add additional domains that your Mini App can interact with.
                  All other domains will be blocked. You do not need to specify
                  subdomains. Ex: https://example.com
                </Typography>
              </div>

              <TextArea
                label=""
                disabled={!canEdit}
                placeholder="https://example.com, https://example2.com"
                register={register("associated_domains", {
                  onChange: formatArrayInput,
                })}
                enableResize={false}
                rows={4}
                className={clsx(
                  "h-[120px] max-h-[120px] min-h-[120px] !rounded-[10px] !bg-grey-50 placeholder:!text-[#717680]",
                  errors.associated_domains
                    ? "!border !border-system-error-500"
                    : "!border-0",
                )}
                errors={errors.associated_domains}
              />
            </div>

            <div className="w-full border-t border-grey-100" />

            <div className="grid gap-y-5">
              <div className="grid gap-y-3">
                <Typography
                  variant={TYPOGRAPHY.H7}
                  className="font-normal text-grey-900"
                >
                  Whitelisted Payment Addresses
                </Typography>
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                  These addresses are authorised to receive payments for your
                  mini app. Payment requests to other addresses will be
                  rejected.
                </Typography>
              </div>

              {isWhitelistDisabled && (
                <InlineWarning>
                  Disabling the whitelist removes protection from payments to
                  invalid addresses.
                </InlineWarning>
              )}

              <TextArea
                label=""
                disabled={!canEdit || isWhitelistDisabled}
                placeholder="Whitelisted Payment Addresses"
                register={register("whitelisted_addresses", {
                  onChange: formatArrayInput,
                })}
                enableResize={false}
                rows={4}
                className={clsx(
                  "h-[120px] max-h-[120px] min-h-[120px] !rounded-[10px] !border-0 !bg-grey-50",
                  errors.whitelisted_addresses
                    ? "!border !border-system-error-500"
                    : "!border-0",
                  isWhitelistDisabled
                    ? "placeholder:!text-[#B1B8C2]"
                    : "placeholder:!text-[#717680]",
                )}
                errors={errors.whitelisted_addresses}
              />

              <label
                htmlFor="is_whitelist_disabled"
                className="grid w-fit cursor-pointer grid-cols-auto/1fr items-center gap-x-4"
              >
                <Checkbox
                  id="is_whitelist_disabled"
                  register={register("is_whitelist_disabled")}
                  disabled={!canEdit}
                />
                <Typography variant={TYPOGRAPHY.S2} className="text-grey-900">
                  Disable whitelist
                </Typography>
              </label>
            </div>

            <div className="w-full border-t border-grey-100" />

            <div className="grid gap-y-5">
              <div className="grid gap-y-3">
                <Typography
                  variant={TYPOGRAPHY.H7}
                  className="font-normal text-grey-900"
                >
                  Permit2 Tokens
                </Typography>
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                  List all the tokens that you intend to use in your Mini App.
                  Any other tokens will be blocked.
                </Typography>
              </div>

              <TextArea
                label=""
                disabled={!canEdit}
                placeholder="0xad312321..., 0xE901e312..."
                register={register("permit2_tokens", {
                  onChange: formatArrayInput,
                })}
                enableResize={false}
                rows={4}
                className={clsx(
                  "h-[120px] max-h-[120px] min-h-[120px] !rounded-[10px] !bg-grey-50 placeholder:!text-[#717680]",
                  errors.permit2_tokens
                    ? "!border !border-system-error-500"
                    : "!border-0",
                )}
                errors={errors.permit2_tokens}
              />
            </div>

            <div className="w-full border-t border-grey-100" />

            <div className="grid gap-y-5">
              <div className="grid gap-y-3">
                <Typography
                  variant={TYPOGRAPHY.H7}
                  className="font-normal text-grey-900"
                >
                  Contract Entrypoints
                </Typography>
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                  List here contracts that you intend to call functions directly
                  on.
                </Typography>
              </div>

              <TextArea
                label=""
                disabled={!canEdit}
                placeholder="0xb731d321..., 0xF2310312..."
                register={register("contracts", {
                  onChange: formatArrayInput,
                })}
                enableResize={false}
                rows={4}
                className={clsx(
                  "h-[120px] max-h-[120px] min-h-[120px] !rounded-[10px] !bg-grey-50 placeholder:!text-[#717680]",
                  errors.contracts
                    ? "!border !border-system-error-500"
                    : "!border-0",
                )}
                errors={errors.contracts}
              />
            </div>

            <div className="w-full border-t border-grey-100" />

            <div className="grid gap-y-5">
              <div className="grid gap-y-3">
                <Typography
                  variant={TYPOGRAPHY.H7}
                  className="font-normal text-grey-900"
                >
                  Permissions
                </Typography>
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                  Request permissions to access notifications or contacts.
                </Typography>
              </div>

              <InlineWarning>
                <>
                  Unlimited notifications are very rarely granted and will be
                  rejected most of the time. Refer to{" "}
                  <Link
                    href="https://docs.world.org/mini-apps/commands/how-to-send-notifications"
                    className="underline"
                  >
                    docs
                  </Link>{" "}
                  for guidelines.
                </>
              </InlineWarning>

              <Typography variant={TYPOGRAPHY.R3} className="text-grey-900">
                Select your desired maximum notifications per day:
              </Typography>

              <Controller
                name="max_notifications_per_day"
                control={control}
                render={({ field }) => {
                  return (
                    <div className="flex items-center gap-x-8">
                      {maxNotificationPerDayOptions.map((option) => {
                        const optionValue = option;
                        const isSelected = field.value === optionValue;

                        return (
                          <label
                            key={String(option)}
                            className={clsx(
                              "flex items-center gap-x-4",
                              canEdit ? "cursor-pointer" : "cursor-not-allowed",
                            )}
                          >
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={() => field.onChange(optionValue)}
                              className={clsx(
                                "flex size-5 items-center justify-center rounded-full border-[1.25px]",
                                isSelected
                                  ? "border-grey-900 bg-grey-900 text-grey-0"
                                  : "border-grey-200 bg-transparent",
                              )}
                              aria-pressed={isSelected}
                              aria-label={`Set notifications per day to ${option === "unlimited" ? "Unlimited" : option}`}
                            >
                              {isSelected && (
                                <CheckIcon size="16" className="size-[13px]" />
                              )}
                            </button>
                            <Typography
                              variant={TYPOGRAPHY.S2}
                              className="text-grey-900"
                            >
                              {option === "unlimited" ? "Unlimited" : option}
                            </Typography>
                          </label>
                        );
                      })}
                    </div>
                  );
                }}
              />
            </div>
          </>
        )}

        <div className="fixed bottom-[5.25rem] right-6 z-10 flex items-center gap-x-3 md:bottom-6">
          <SaveStatusIndicator />
          <DecoratedButton
            type="button"
            className="h-12 w-40"
            disabled={!canEdit || displayStatus.state === "saving"}
            onClick={() => {
              void flushAll();
            }}
          >
            <Typography variant={TYPOGRAPHY.M3}>
              {displayStatus.state === "saving" ? "Saving…" : "Save changes"}
            </Typography>
          </DecoratedButton>
        </div>
      </form>

      <MiniAppQrPanel
        appId={appId}
        appMetadata={appMetadata}
        isMiniApp={isMiniApp}
      />
    </div>
  );
};
