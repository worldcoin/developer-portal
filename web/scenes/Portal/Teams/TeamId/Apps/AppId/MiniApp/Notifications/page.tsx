"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { NotificationBellIcon } from "@/components/Icons/NotificationBellIcon";
import { Typography } from "@/components/Typography";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { ChangeEvent, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { VersionSwitcher } from "../../Configuration/AppTopBar/VersionSwitcher";
import { useFetchNotificationAppMetadataQuery } from "./graphql/client/fetch-notification-app-metadata.generated";

type NotificationFormData = {
  walletAddresses: string;
  title?: string;
  message: string;
  miniAppPath: string;
  apiKey: string;
};

export const NotificationsPage = () => {
  const params = useParams<{ teamId: string; appId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"verified" | "unverified">(
    "verified",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: appMetadataData } = useFetchNotificationAppMetadataQuery({
    variables: { id: params?.appId ?? "" },
    skip: !params?.appId,
  });

  const appData = appMetadataData?.app[0];
  const draftId = appData?.app_metadata[0]?.id;
  const hasBothVersions =
    (appData?.app_metadata.length ?? 0) > 0 &&
    (appData?.verified_app_metadata.length ?? 0) > 0;

  const {
    register,
    handleSubmit,
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
        ...(viewMode === "unverified" && draftId ? { draft_id: draftId } : {}),
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

  return (
    <div className="my-8 grid max-w-[1180px] gap-y-10">
      <div className="grid h-[72px] grid-cols-auto/1fr items-center gap-x-3 rounded-[10px] bg-[#E6F0FF] p-5">
        <NotificationBellIcon className="size-8" aria-hidden="true" />

        <div className="font-world text-[13px] leading-[120%] text-grey-900">
          <Typography as="p" className="font-world text-[13px] font-semibold">
            Notifications
          </Typography>
          <Typography as="p" className="font-world text-[13px] font-medium">
            Send notifications to specific wallet addresses. Unverified apps are
            limited to 40 notifications per 4 hours.{" "}
            <a
              href="https://docs.world.org/mini-apps/reference/api#send-notification"
              target="_blank"
              className="underline"
              rel="noopener noreferrer"
            >
              Docs reference
            </a>
          </Typography>
        </div>
      </div>

      <div className="grid gap-y-10">
        <div className="flex items-center justify-between gap-x-5">
          <Typography
            as="h1"
            className="font-world text-[26px] font-semibold leading-[120%] tracking-[-0.01em] text-[#191C20]"
          >
            Notifications
          </Typography>

          {hasBothVersions && (
            <VersionSwitcher
              viewMode={viewMode}
              setMode={setViewMode}
              verifiedAt={appData?.verified_app_metadata[0]?.verified_at}
              buttonClassName="px-3 py-1.5 text-sm"
            />
          )}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid w-full max-w-[580px] gap-y-5"
        >
          <div className="grid gap-y-5">
            <div className="flex items-center justify-between gap-x-5">
              <Typography
                as="h2"
                className="font-world text-[17px] font-medium leading-[120%] text-grey-900"
              >
                Wallet addresses
              </Typography>

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
                  className="h-10 min-w-[109px] px-3.5 py-0 text-[15px] font-semibold"
                >
                  Import CSV
                </DecoratedButton>

                {walletAddressesValue && (
                  <DecoratedButton
                    type="button"
                    variant="secondary"
                    onClick={handleClearAddresses}
                    className="h-10 min-w-[109px] px-3.5 py-0 text-[15px] font-semibold"
                  >
                    Clear all
                  </DecoratedButton>
                )}
              </div>
            </div>

            <div className="grid gap-y-1">
              <textarea
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
                rows={4}
                placeholder="Enter wallet addresses separated by commas"
                className="h-[120px] resize-none rounded-[10px] border-0 bg-grey-50 p-4 font-world text-[15px] leading-[130%] text-grey-900 placeholder:text-grey-500 focus:outline-none focus:ring-0"
                aria-invalid={errors.walletAddresses ? "true" : "false"}
              />

              <p className="px-2 font-world text-xs leading-[130%] text-grey-500">
                {walletAddressCount}/1000 addresses - Enter one or more wallet
                addresses, separated by commas
              </p>
              {errors.walletAddresses?.message && (
                <p className="px-2 text-xs text-system-error-500">
                  {errors.walletAddresses.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-y-1">
            <input
              {...register("title", {
                maxLength: {
                  value: 30,
                  message: "Title cannot exceed 30 characters",
                },
              })}
              maxLength={30}
              placeholder="Notification title"
              className="h-14 rounded-[10px] border-0 bg-grey-50 px-4 py-3 font-world text-[15px] leading-[130%] text-grey-900 placeholder:text-grey-500 focus:outline-none focus:ring-0"
              aria-invalid={errors.title ? "true" : "false"}
            />
            <p className="px-2 font-world text-xs leading-[130%] text-grey-500">
              {titleValue?.length || 0}/30 characters
            </p>
            {errors.title?.message && (
              <p className="px-2 text-xs text-system-error-500">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid gap-y-1">
            <textarea
              {...register("message", {
                required: "Message is required",
                maxLength: {
                  value: 200,
                  message: "Message cannot exceed 200 characters",
                },
              })}
              maxLength={200}
              rows={1}
              placeholder="Notification message"
              className="h-14 resize-none rounded-[10px] border-0 bg-grey-50 px-4 py-3 font-world text-[15px] leading-[130%] text-grey-900 placeholder:text-grey-500 focus:outline-none focus:ring-0"
              aria-invalid={errors.message ? "true" : "false"}
            />
            <p className="px-2 font-world text-xs leading-[130%] text-grey-500">
              {messageValue?.length || 0}/200 characters
            </p>
            {errors.message?.message && (
              <p className="px-2 text-xs text-system-error-500">
                {errors.message.message}
              </p>
            )}
          </div>

          <div className="grid gap-y-1">
            <input
              {...register("miniAppPath", {
                required: "Mini App Path is required",
              })}
              placeholder="Mini App Path"
              className="h-14 rounded-[10px] border-0 bg-grey-50 px-4 py-3 font-world text-[15px] leading-[130%] text-grey-900 placeholder:text-grey-500 focus:outline-none focus:ring-0"
              aria-invalid={errors.miniAppPath ? "true" : "false"}
            />
            <p className="px-2 font-world text-xs leading-[130%] text-grey-500">
              The path inside your mini app that will open when the notification
              is tapped
            </p>
            {errors.miniAppPath?.message && (
              <p className="px-2 text-xs text-system-error-500">
                {errors.miniAppPath.message}
              </p>
            )}
          </div>

          <div className="grid gap-y-1">
            <input
              {...register("apiKey", {
                required: "API Key is required",
              })}
              placeholder="API Key"
              className="h-14 rounded-[10px] border-0 bg-grey-50 px-4 py-3 font-world text-[15px] leading-[130%] text-grey-900 placeholder:text-grey-500 focus:outline-none focus:ring-0"
              aria-invalid={errors.apiKey ? "true" : "false"}
            />
            <p className="px-2 font-world text-xs leading-[130%] text-grey-500">
              Your Developer Portal API key (format: api_...). Obtain it from
              the API Keys tab.
            </p>
            {errors.apiKey?.message && (
              <p className="px-2 text-xs text-system-error-500">
                {errors.apiKey.message}
              </p>
            )}
          </div>

          <DecoratedButton
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            className="mt-5 h-14 w-fit px-6 py-0 text-[17px] font-semibold"
          >
            Send notification
          </DecoratedButton>
        </form>
      </div>
    </div>
  );
};
