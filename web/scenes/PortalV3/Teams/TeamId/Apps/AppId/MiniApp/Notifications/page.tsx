"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { NotificationBellIcon } from "@/components/Icons/NotificationBellIcon";
import { Link } from "@/components/Link";
import { urls } from "@/lib/urls";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FormSkeleton } from "../../Configuration/PageComponents/FormSkeleton";
import { TextField } from "../../Configuration/Wizard/TextField";
import { useQuery } from "@apollo/client/react";
import { FetchNotificationAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/MiniApp/Notifications/graphql/client/fetch-notification-app-metadata.generated";
import { noticeIconClassName } from "@/scenes/PortalV3/common/Icon";
import {
  MiniAppPage,
  MiniAppPageColumn,
  MiniAppPageHeader,
  MiniAppSectionHeading,
} from "../common/MiniAppPage";
import { NoticeCallout } from "../common/NoticeCallout";
import { TextArea } from "../common/TextArea";
import {
  miniAppButtonClassName,
  miniAppButtonLargeClassName,
  miniAppFieldHintClassName,
} from "../common/styles";

type NotificationFormData = {
  walletAddresses: string;
  title?: string;
  message: string;
  miniAppPath: string;
  apiKey: string;
};

const NotificationsNotice = ({
  title,
  body,
}: {
  title: string;
  body: ReactNode;
}) => (
  <MiniAppPage>
    <MiniAppPageHeader
      title="Notifications"
      description="Send notifications to specific wallet addresses."
    />

    <MiniAppPageColumn>
      <NoticeCallout
        title={title}
        icon={
          <NotificationBellIcon
            className={`${noticeIconClassName} size-8 shrink-0`}
            aria-hidden="true"
          />
        }
      >
        {body}
      </NoticeCallout>
    </MiniAppPageColumn>
  </MiniAppPage>
);

export const NotificationsPage = () => {
  const params = useParams<{ teamId: string; appId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: appMetadataData, loading } = useQuery(
    FetchNotificationAppMetadataDocument,
    {
      variables: { id: params?.appId ?? "" },
      skip: !params?.appId,
    },
  );

  const appData = appMetadataData?.app[0];
  const draftMeta = appData?.app_metadata[0];
  const verifiedMeta = appData?.verified_app_metadata[0];
  const notificationMeta = verifiedMeta ?? draftMeta;

  // `category` may be the "External" app-store category even for a Mini App, so
  // the external check must look at app_mode only — never the category. The
  // API also prioritizes verified metadata, falling back to the autosaved draft
  // only when the app has no verified version.
  const isExternalApp = notificationMeta?.app_mode === "external";
  const hasPendingMiniAppDraft =
    verifiedMeta?.app_mode === "external" && draftMeta?.app_mode === "mini-app";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<NotificationFormData>({
    defaultValues: {
      walletAddresses: "",
      title: "",
      message: "",
      miniAppPath: "",
      apiKey: "",
    },
  });

  const titleValue = watch("title");
  const messageValue = watch("message");
  const walletAddressesValue = watch("walletAddresses");

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // check if file is CSV
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    try {
      const text = await file.text();
      parseAndSetWalletAddresses(text);
    } catch {
      toast.error("Failed to read CSV file");
    } finally {
      // reset the file input so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const parseAndSetWalletAddresses = (csvText: string) => {
    try {
      // assume one wallet address per line, allow columns
      const lines = csvText.split(/\r?\n/);
      const addresses: string[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        // split by comma and take the first column if there are multiple columns
        const columns = line.split(",");
        const address = columns[0]?.trim();

        if (address && address.startsWith("0x") && address.length === 42) {
          addresses.push(address);
        }
      }

      if (addresses.length === 0) {
        toast.error("No valid wallet addresses found in CSV");
        return;
      }

      const uniqueAddresses = [...new Set(addresses)];

      if (uniqueAddresses.length > 1000) {
        toast.error("Maximum number of addresses is 1000.");
        return;
      }

      setValue("walletAddresses", uniqueAddresses.join(", \n"));

      toast.success(
        `Successfully imported ${uniqueAddresses.length} wallet addresses from CSV`,
      );
    } catch {
      toast.error("Failed to parse CSV file");
    }
  };

  const handleClearAddresses = () => {
    setValue("walletAddresses", "");
  };

  const onSubmit = async (data: NotificationFormData) => {
    setIsSubmitting(true);

    try {
      // convert comma-separated wallet addresses to array
      const walletAddresses = data.walletAddresses
        .split(",")
        .map((address) => address.trim())
        .filter((address) => address.length > 0);

      // check if params.appId exists
      if (!params?.appId) {
        throw new Error("App ID is missing");
      }

      // check if API key is provided
      if (!data.apiKey) {
        throw new Error("API key is required");
      }

      const payload = {
        app_id: params.appId,
        wallet_addresses: walletAddresses,
        title: data.title || undefined,
        message: data.message,
        mini_app_path: data.miniAppPath,
        ...(!verifiedMeta && draftMeta?.id ? { draft_id: draftMeta.id } : {}),
      };

      const response = await fetch("/api/v2/minikit/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        posthog.capture("notification_sent", {
          teamId: params.teamId,
          appId: params.appId,
          recipient_count: walletAddresses.length,
        });
        toast.success("Notification sent successfully");
      } else {
        toast.error(result.error?.detail || "Failed to send notification");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while sending notification",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const walletAddressCount =
    walletAddressesValue
      ?.split(",")
      .filter((address) => address.trim().length > 0).length ?? 0;

  if (loading) {
    return (
      <MiniAppPage>
        <FormSkeleton count={5} />
      </MiniAppPage>
    );
  }

  if (isExternalApp) {
    return (
      <NotificationsNotice
        title="Notifications unavailable"
        body={
          hasPendingMiniAppDraft ? (
            <>
              Your Mini App draft is ready, but notifications remain unavailable
              until the draft is approved. Review its status in{" "}
              <Link
                href={urls.configuration({
                  team_id: params.teamId,
                  app_id: params.appId,
                })}
                className="underline"
              >
                Get Verified
              </Link>
              .
            </>
          ) : (
            <>
              Notifications are available to Mini Apps. Change your app type in{" "}
              <Link
                href={urls.configuration({
                  team_id: params.teamId,
                  app_id: params.appId,
                })}
                className="underline"
              >
                Get Verified
              </Link>{" "}
              to enable them.
            </>
          )
        }
      />
    );
  }

  return (
    <MiniAppPage>
      <MiniAppPageHeader
        id="notifications-heading"
        title="Notifications"
        description="Send notifications to specific wallet addresses."
      />

      <MiniAppPageColumn labelledBy="notifications-heading">
        <NoticeCallout
          variant="info"
          title="Notifications"
          icon={
            <NotificationBellIcon
              className="size-8 shrink-0"
              aria-hidden="true"
            />
          }
        >
          Unverified apps are limited to 40 notifications per 4 hours.{" "}
          <a
            href="https://docs.world.org/api-reference/developer-portal/send-notification"
            target="_blank"
            className="inline-block whitespace-nowrap underline"
            rel="noopener noreferrer"
          >
            Docs reference
          </a>
        </NoticeCallout>

        <form onSubmit={handleSubmit(onSubmit)} className="grid w-full gap-y-5">
          <div className="grid gap-y-4">
            <div className="flex items-center justify-between gap-x-5">
              <MiniAppSectionHeading>Wallet addresses</MiniAppSectionHeading>

              <div className="flex gap-x-2">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />

                <DecoratedButton
                  type="button"
                  variant="secondary"
                  onClick={handleImportClick}
                  className={miniAppButtonClassName}
                >
                  Import CSV
                </DecoratedButton>

                {walletAddressesValue && (
                  <DecoratedButton
                    type="button"
                    variant="secondary"
                    onClick={handleClearAddresses}
                    className={miniAppButtonClassName}
                  >
                    Clear all
                  </DecoratedButton>
                )}
              </div>
            </div>

            <TextArea
              label="Wallet addresses"
              id="notification-wallet-addresses"
              rows={4}
              className="h-[88px]"
              placeholder="0x… , 0x…"
              hint={`${walletAddressCount}/1000 addresses, separated by commas`}
              error={errors.walletAddresses?.message}
              {...register("walletAddresses", {
                required: "Wallet addresses are required",
                validate: (value) => {
                  const addresses = value
                    .split(",")
                    .map((address) => address.trim())
                    .filter((address) => address.length > 0);
                  if (addresses.length === 0)
                    return "At least one wallet address is required";
                  if (addresses.length > 1000)
                    return "Maximum 1000 wallet addresses allowed";
                  return true;
                },
              })}
            />
          </div>

          <div className="grid gap-y-1.5">
            <Controller
              control={control}
              name="title"
              rules={{
                maxLength: {
                  value: 30,
                  message: "Title cannot exceed 30 characters",
                },
              }}
              render={({ field }) => (
                <TextField
                  label="Notification title"
                  name="title"
                  maxLength={30}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.title?.message}
                />
              )}
            />
            <p className={miniAppFieldHintClassName}>
              {titleValue?.length || 0}/30 characters
            </p>
          </div>

          <TextArea
            label="Notification message"
            id="notification-message"
            rows={2}
            className="h-[44px]"
            maxLength={200}
            hint={`${messageValue?.length || 0}/200 characters`}
            error={errors.message?.message}
            {...register("message", {
              required: "Message is required",
              maxLength: {
                value: 200,
                message: "Message cannot exceed 200 characters",
              },
            })}
          />

          <div className="grid gap-y-1.5">
            <Controller
              control={control}
              name="miniAppPath"
              rules={{ required: "Mini App Path is required" }}
              render={({ field }) => (
                <TextField
                  label="Mini App path"
                  name="miniAppPath"
                  required
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.miniAppPath?.message}
                />
              )}
            />
            <p className={miniAppFieldHintClassName}>
              The path inside your mini app that will open when the notification
              is tapped
            </p>
          </div>

          <div className="grid gap-y-1.5">
            <Controller
              control={control}
              name="apiKey"
              rules={{ required: "API Key is required" }}
              render={({ field }) => (
                <TextField
                  label="API key"
                  name="apiKey"
                  required
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.apiKey?.message}
                />
              )}
            />
            <p className={miniAppFieldHintClassName}>
              Your Developer Portal API key (format: api_...). Obtain it from
              the API Keys tab.
            </p>
          </div>

          <DecoratedButton
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            className={`mt-5 w-fit ${miniAppButtonLargeClassName}`}
          >
            Send notification
          </DecoratedButton>
        </form>
      </MiniAppPageColumn>
    </MiniAppPage>
  );
};
