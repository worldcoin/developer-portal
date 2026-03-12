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
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../Configuration/graphql/client/fetch-app-metadata.generated";
import {
  updateSetupInitialSchema,
  UpdateSetupInitialSchema,
} from "../../Configuration/Advanced/page/form-schema";
import { validateAndUpdateSetupServerSide } from "../../Configuration/Advanced/page/server/submit";

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
  const isEditable = appMetadata?.verification_status === "unverified";

  const { refetch: refetchAppMetadata } = useRefetchQueries(
    FetchAppMetadataDocument,
    {
      id: appId,
    },
  );

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [teamId, user]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
    setError,
    control,
  } = useForm<UpdateSetupInitialSchema>({
    resolver: yupResolver(updateSetupInitialSchema),
    mode: "onChange",
    defaultValues: getFormValuesFromMetadata(appMetadata),
  });

  const metadataFormValues = useMemo(
    () => getFormValuesFromMetadata(appMetadata),
    [
      appMetadata?.whitelisted_addresses,
      appMetadata?.app_mode,
      appMetadata?.associated_domains,
      appMetadata?.contracts,
      appMetadata?.permit2_tokens,
      appMetadata?.can_import_all_contacts,
      appMetadata?.can_use_attestation,
      appMetadata?.max_notifications_per_day,
      appMetadata?.is_allowed_unlimited_notifications,
    ],
  );

  useEffect(() => {
    reset(metadataFormValues);
  }, [reset, metadataFormValues]);

  const submit = useCallback(
    async (values: UpdateSetupInitialSchema) => {
      if (
        values.app_mode &&
        values.app_mode !== "external" &&
        !values.is_whitelist_disabled &&
        (!values.whitelisted_addresses ||
          values.whitelisted_addresses.length === 0)
      ) {
        setError("whitelisted_addresses", {
          type: "manual",
          message:
            "Mini Apps must have at least one whitelisted payment address.",
        });
        return;
      }

      const result = await validateAndUpdateSetupServerSide(
        values,
        appMetadata?.id ?? "",
      );

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      refetchAppMetadata();
      toast.success("App information updated successfully");
    },
    [appMetadata?.id, refetchAppMetadata, setError],
  );

  const appMode = useWatch({ control, name: "app_mode" });
  const isWhitelistDisabled = useWatch({
    control,
    name: "is_whitelist_disabled",
  });

  const canEdit = isEditable && isEnoughPermissions;

  return (
    <form
      className="grid max-w-[580px] gap-y-10"
      onSubmit={handleSubmit(submit)}
    >
      {isDirty && (
        <Typography variant={TYPOGRAPHY.R4} className="text-system-warning-500">
          Warning: You have unsaved changes
        </Typography>
      )}

      {appMode === "mini-app" && (
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
                Add additional domains that your Mini App can interact with. All
                other domains will be blocked. You do not need to specify
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
                These addresses are authorised to receive payments for your mini
                app. Payment requests to other addresses will be rejected.
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
                List all the tokens that you intend to use in your Mini App. Any
                other tokens will be blocked.
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

      <DecoratedButton
        type="submit"
        className="h-14 w-[159px] rounded-full px-6"
        disabled={!canEdit || !isValid}
      >
        <Typography variant={TYPOGRAPHY.M3}>Save changes</Typography>
      </DecoratedButton>
    </form>
  );
};
