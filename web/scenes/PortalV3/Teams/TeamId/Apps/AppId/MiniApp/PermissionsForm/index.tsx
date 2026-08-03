"use client";

import { HelpIcon } from "@/components/Icons/HelpIcon";
import { Link } from "@/components/Link";
import { Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useApolloClient } from "@apollo/client/react";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Control, Controller, useForm, useWatch } from "react-hook-form";
import {
  updatePermissionsSchema,
  UpdatePermissionsSchema,
} from "../../Configuration/Advanced/page/form-schema";
import { validateAndUpdatePermissionsServerSide } from "../../Configuration/Advanced/page/server/submit";
import { useAutosaveWithStatus } from "../../Configuration/hook/use-autosave-with-status";
import { EntryList } from "./EntryList";
import { isValidHttpsDomain, normalizeDomainInput } from "./domain-utils";

type PermissionsFormProps = {
  appId: string;
  teamId: string;
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
};

type ListFieldName =
  | "associated_domains"
  | "whitelisted_addresses"
  | "permit2_tokens"
  | "contracts";

const maxNotificationPerDayOptions = [0, 1, 2, "unlimited"] as const;

// Kept in sync with the validation rules in
// ../../Configuration/Advanced/page/form-schema
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const isEthAddress = (value: string) => ETH_ADDRESS_REGEX.test(value);

const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const splitList = (value?: string | null): string[] =>
  value
    ? value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

const joinList = (values: string[]): string | null =>
  values.length > 0 ? values.join(",") : null;

const HelpTooltip = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <span className="group relative mt-px inline-flex shrink-0">
    <button
      type="button"
      aria-label={label}
      className="flex size-4 shrink-0 items-center justify-center rounded-full p-0 leading-none text-grey-300 transition-colors hover:text-grey-500 focus:outline-none focus-visible:text-grey-500"
    >
      <HelpIcon className="size-4" />
    </button>

    <span
      role="tooltip"
      className="pointer-events-none absolute top-full left-1/2 z-30 mt-2 w-72 -translate-x-1/2 rounded-xl bg-grey-900 px-3.5 py-3 opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
    >
      <span className="font-world text-[13px] leading-[145%] font-medium text-grey-0">
        {children}
      </span>
      <span
        className="absolute bottom-full left-1/2 size-2.5 -translate-x-1/2 translate-y-1/2 rotate-45 rounded-[2px] bg-grey-900"
        aria-hidden
      />
    </span>
  </span>
);

const SectionHeader = (props: {
  title: string;
  description?: string;
  tooltip?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex items-start justify-between gap-x-5">
    <div className="grid gap-y-2">
      <div className="flex min-w-0 items-start gap-x-1.5">
        <Typography
          as="h2"
          className="min-w-0 font-world text-[17px] leading-[120%] font-medium text-grey-900"
        >
          {props.title}
        </Typography>

        {props.tooltip && (
          <HelpTooltip label={`About ${props.title}`}>
            {props.tooltip}
          </HelpTooltip>
        )}
      </div>

      {props.description && (
        <Typography
          as="p"
          className="font-world text-[13px] leading-[130%] font-medium text-grey-500"
        >
          {props.description}
        </Typography>
      )}
    </div>

    {props.action}
  </div>
);

const NotificationLimitCard = ({
  control,
  disabled,
}: {
  control: Control<UpdatePermissionsSchema>;
  disabled: boolean;
}) => (
  <section className="grid gap-y-5 rounded-2xl bg-grey-0 ">
    <div className="grid gap-y-1">
      <Typography
        as="h2"
        className="font-world text-[17px] leading-[120%] font-medium text-grey-900"
      >
        Notifications
      </Typography>
      <Typography
        as="p"
        className="font-world text-[13px] leading-[130%] font-medium text-grey-500"
      >
        Maximum notifications per user each day. See{" "}
        <Link
          href="https://docs.world.org/mini-apps/commands/how-to-send-notifications"
          className="underline"
        >
          docs
        </Link>{" "}
        for guidelines.
      </Typography>
    </div>

    <Controller
      name="max_notifications_per_day"
      control={control}
      render={({ field }) => {
        const selectedIndex = Math.max(
          0,
          maxNotificationPerDayOptions.indexOf(
            field.value as (typeof maxNotificationPerDayOptions)[number],
          ),
        );
        const selectedLabel = maxNotificationPerDayOptions[selectedIndex];

        return (
          <div className="grid gap-y-1.5 px-1">
            <div className="relative h-7">
              <div className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-grey-100" />
              <div
                className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-blue-500"
                style={{ width: `${(selectedIndex / 3) * 100}%` }}
              />

              {maxNotificationPerDayOptions.map((option, index) => {
                const isSelected = index === selectedIndex;
                const isPassed = index < selectedIndex;

                return (
                  <span
                    key={String(option)}
                    className={clsx(
                      "pointer-events-none absolute top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
                      isSelected
                        ? "size-4 border-blue-500 bg-grey-0 shadow-sm"
                        : "size-3",
                      isPassed
                        ? "border-blue-500 bg-blue-500"
                        : !isSelected && "border-grey-200 bg-grey-0",
                    )}
                    style={{ left: `${(index / 3) * 100}%` }}
                    aria-hidden="true"
                  />
                );
              })}

              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={selectedIndex}
                disabled={disabled}
                onChange={(event) => {
                  field.onChange(
                    maxNotificationPerDayOptions[Number(event.target.value)],
                  );
                }}
                aria-label="Maximum notifications per user each day"
                aria-valuetext={
                  selectedLabel === "unlimited"
                    ? "Unlimited"
                    : String(selectedLabel)
                }
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
            </div>

            <div className="relative h-5">
              {maxNotificationPerDayOptions.map((option, index) => (
                <span
                  key={String(option)}
                  className={clsx(
                    "absolute font-world text-[12px] leading-none font-medium",
                    index === 0
                      ? ""
                      : index === maxNotificationPerDayOptions.length - 1
                        ? "-translate-x-full"
                        : "-translate-x-1/2",
                    index === selectedIndex ? "text-grey-900" : "text-grey-400",
                  )}
                  style={{ left: `${(index / 3) * 100}%` }}
                >
                  {option === "unlimited" ? "Unlimited" : option}
                </span>
              ))}
            </div>
          </div>
        );
      }}
    />
  </section>
);

const getFormValuesFromMetadata = (
  appMetadata: PermissionsFormProps["appMetadata"],
): UpdatePermissionsSchema => ({
  whitelisted_addresses: appMetadata?.whitelisted_addresses?.join(",") ?? null,
  is_whitelist_disabled:
    (appMetadata?.whitelisted_addresses?.length ?? 0) === 0,
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

export const SetupForm = ({ teamId, appMetadata }: PermissionsFormProps) => {
  const { user } = useUser() as Auth0SessionUser;
  const apolloClient = useApolloClient();
  const isEditable = appMetadata?.verification_status === "unverified";

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [teamId, user]);

  const form = useForm<UpdatePermissionsSchema>({
    resolver: yupResolver(updatePermissionsSchema),
    mode: "onChange",
    defaultValues: getFormValuesFromMetadata(appMetadata),
  });
  const {
    reset,
    formState: { errors },
    clearErrors,
    control,
    setValue,
  } = form;

  // Reset only when the underlying app id changes (e.g. version switch),
  // never on cache updates that happen while the user is mid-edit.
  const previousMetadataIdRef = useRef(appMetadata?.id);
  useEffect(() => {
    if (previousMetadataIdRef.current !== appMetadata?.id) {
      reset(getFormValuesFromMetadata(appMetadata));
      previousMetadataIdRef.current = appMetadata?.id;
    }
  }, [appMetadata, reset, previousMetadataIdRef]);

  const canEdit = isEditable && isEnoughPermissions;

  useAutosaveWithStatus<UpdatePermissionsSchema>({
    id: "mini-app-permissions",
    form,
    enabled: canEdit,
    save: async (values, signal) => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const result = await validateAndUpdatePermissionsServerSide(
        values,
        appMetadata?.id ?? "",
      );
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (!result.success) throw new Error(result.message);

      if (appMetadata?.id) {
        const cacheId = apolloClient.cache.identify({
          __typename: "app_metadata",
          id: appMetadata.id,
        });
        if (cacheId) {
          const arrayOrNull = (value?: string | null) => {
            const entries = splitList(value);
            return entries.length > 0 ? entries : null;
          };
          const isUnlimited = values.max_notifications_per_day === "unlimited";

          apolloClient.cache.modify({
            id: cacheId,
            fields: {
              associated_domains: () => arrayOrNull(values.associated_domains),
              whitelisted_addresses: () =>
                values.is_whitelist_disabled
                  ? null
                  : arrayOrNull(values.whitelisted_addresses),
              permit2_tokens: () => arrayOrNull(values.permit2_tokens),
              contracts: () => arrayOrNull(values.contracts),
              can_import_all_contacts: () =>
                Boolean(values.can_import_all_contacts),
              can_use_attestation: () => Boolean(values.can_use_attestation),
              is_allowed_unlimited_notifications: () => isUnlimited,
              max_notifications_per_day: () =>
                isUnlimited ? 0 : Number(values.max_notifications_per_day),
            },
          });
        }
      }
    },
  });

  const associatedDomains = useWatch({ control, name: "associated_domains" });
  const whitelistedAddresses = useWatch({
    control,
    name: "whitelisted_addresses",
  });
  const permit2Tokens = useWatch({ control, name: "permit2_tokens" });
  const contracts = useWatch({ control, name: "contracts" });

  const domains = useMemo(
    () => splitList(associatedDomains),
    [associatedDomains],
  );
  const whitelist = useMemo(
    () => splitList(whitelistedAddresses),
    [whitelistedAddresses],
  );
  const tokens = useMemo(() => splitList(permit2Tokens), [permit2Tokens]);
  const contractList = useMemo(() => splitList(contracts), [contracts]);

  const setListValue = useCallback(
    (name: ListFieldName, next: string[]) => {
      setValue(name, joinList(next), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  return (
    <div className="grid w-full gap-y-8">
      <div className="grid w-full gap-y-5">
        <div className="grid gap-y-2">
          <Typography
            as="h1"
            className="font-world text-[26px] leading-[120%] font-semibold tracking-[-0.01em] text-[#191C20]"
          >
            Mini App Permissions
          </Typography>

          <Typography
            as="p"
            className="font-world text-[15px] leading-[130%] font-medium text-grey-500"
          >
            Control which resources your Mini App can access.
          </Typography>
        </div>

        <div className="border-t border-grey-100" />

        <div className="grid">
          <section className="grid gap-y-3 pb-4">
            <SectionHeader
              title="Additional Domains"
              tooltip="Additional Domains are the external websites your Mini App is allowed to open or make requests to from inside World App. Anything you don't list here is blocked, so add every domain your app needs to reach. You don't need to include subdomains, as they're covered automatically."
            />

            <EntryList
              values={domains}
              onChange={(next) => setListValue("associated_domains", next)}
              placeholder="Paste domains, separated by commas"
              disabled={!canEdit}
              validate={isValidHttpsDomain}
              normalize={normalizeDomainInput}
              invalidMessage="Enter valid domains, e.g. example.com"
              duplicateMessage="That domain has already been added."
              copyFieldName="Domain"
              emptyText="Which domains do you want to allow? Subdomains are allowed automatically."
              allowCommaSeparated
            />

            {errors.associated_domains?.message && (
              <p className="px-1 font-world text-xs text-system-error-500">
                {errors.associated_domains.message}
              </p>
            )}
          </section>

          <section className="grid gap-y-3 border-t border-grey-100 py-4">
            <SectionHeader title="Whitelisted Payment Addresses" />

            <EntryList
              values={whitelist}
              onChange={(next) => {
                setValue("whitelisted_addresses", joinList(next), {
                  shouldDirty: true,
                });
                setValue("is_whitelist_disabled", next.length === 0, {
                  shouldDirty: true,
                });
                clearErrors("whitelisted_addresses");
              }}
              placeholder="Paste wallet address"
              disabled={!canEdit}
              validate={isEthAddress}
              invalidMessage="Enter a valid Worldchain address (0x followed by 40 hex characters)."
              duplicateMessage="That address has already been added."
              copyFieldName="Address"
              formatDisplay={truncateAddress}
              emptyText="No addresses yet. Add an address to enforce the payment allowlist."
              allowCommaSeparated
            />

            {errors.whitelisted_addresses?.message && (
              <p className="px-1 font-world text-xs text-system-error-500">
                {errors.whitelisted_addresses.message}
              </p>
            )}
          </section>

          <section className="grid gap-y-3 border-t border-grey-100 py-4">
            <SectionHeader
              title="Permit2 Tokens"
              description="List all the tokens that you intend to use in your Mini App. Any other tokens will be blocked."
              tooltip="Permit2 is Uniswap's shared approval contract that lets users authorize token spending with a single signature instead of a separate on-chain approval per token. List the ERC-20 tokens your Mini App will move through Permit2. Only these tokens can be used for payments or transfers, and any token not listed here is rejected."
            />

            <EntryList
              values={tokens}
              onChange={(next) => setListValue("permit2_tokens", next)}
              placeholder="Paste token addresses, separated by commas"
              disabled={!canEdit}
              validate={isEthAddress}
              invalidMessage="Enter valid Worldchain token addresses (0x followed by 40 hex characters)."
              duplicateMessage="That token has already been added."
              copyFieldName="Token address"
              formatDisplay={truncateAddress}
              allowCommaSeparated
            />

            {errors.permit2_tokens?.message && (
              <p className="px-1 font-world text-xs text-system-error-500">
                {errors.permit2_tokens.message}
              </p>
            )}
          </section>

          <section className="grid gap-y-3 border-t border-grey-100 py-4">
            <SectionHeader
              title="Contract Entrypoints"
              description="List here contracts that you intend to call functions directly on."
              tooltip="Contract Entrypoints are the smart contracts your Mini App is allowed to call functions on directly. List every contract address your app interacts with. Calls to any contract not listed here are blocked, which keeps your app scoped to only the on-chain interactions you expect."
            />

            <EntryList
              values={contractList}
              onChange={(next) => setListValue("contracts", next)}
              placeholder="Paste contract addresses, separated by commas"
              disabled={!canEdit}
              validate={isEthAddress}
              invalidMessage="Enter valid Worldchain contract addresses (0x followed by 40 hex characters)."
              duplicateMessage="That contract has already been added."
              copyFieldName="Contract address"
              formatDisplay={truncateAddress}
              allowCommaSeparated
            />

            {errors.contracts?.message && (
              <p className="px-1 font-world text-xs text-system-error-500">
                {errors.contracts.message}
              </p>
            )}
          </section>
        </div>
      </div>

      <NotificationLimitCard control={control} disabled={!canEdit} />
    </div>
  );
};
