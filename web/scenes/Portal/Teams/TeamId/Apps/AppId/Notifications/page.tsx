"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Notification } from "@/components/Notification";
import { TextArea } from "@/components/TextArea";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useParams } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";
import { useForm } from "react-hook-form";

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
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvImportStatus, setCsvImportStatus] = useState<{
    status: "success" | "error" | "idle";
    message: string;
  }>({ status: "idle", message: "" });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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
      setCsvImportStatus({
        status: "error",
        message: "Please upload a CSV file",
      });
      return;
    }

    try {
      const text = await file.text();
      parseAndSetWalletAddresses(text);
    } catch (error) {
      setCsvImportStatus({
        status: "error",
        message: "Failed to read CSV file",
      });
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
        if (!line.trim()) continue; // skip empty lines

        // split by comma and take the first column if there are multiple columns
        const columns = line.split(",");
        const address = columns[0]?.trim();

        if (address && address.startsWith("0x") && address.length === 42) {
          addresses.push(address);
        }
      }

      if (addresses.length === 0) {
        setCsvImportStatus({
          status: "error",
          message: "No valid wallet addresses found in CSV",
        });
        return;
      }

      if (addresses.length > 1000) {
        setCsvImportStatus({
          status: "error",
          message: `CSV contains ${addresses.length} addresses. Maximum allowed is 1000.`,
        });
        return;
      }

      // if there are existing addresses, append the new ones
      const existingAddresses = walletAddressesValue
        ? walletAddressesValue
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a)
        : [];

      const combinedAddresses = [
        ...new Set([...existingAddresses, ...addresses]),
      ];

      if (combinedAddresses.length > 1000) {
        setCsvImportStatus({
          status: "error",
          message: `Combined addresses exceed the maximum limit of 1000.`,
        });
        return;
      }

      setValue("walletAddresses", combinedAddresses.join(", \n"));

      setCsvImportStatus({
        status: "success",
        message: `Successfully imported ${addresses.length} wallet addresses from CSV`,
      });
    } catch (error) {
      setCsvImportStatus({
        status: "error",
        message: "Failed to parse CSV file",
      });
    }
  };

  const handleClearAddresses = () => {
    setValue("walletAddresses", "");
    setCsvImportStatus({ status: "idle", message: "" });
  };

  const onSubmit = async (data: NotificationFormData) => {
    setIsSubmitting(true);
    setSubmitResult(null);

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
        title: data.title || undefined, // don't send if empty
        message: data.message,
        mini_app_path: data.miniAppPath,
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
        setSubmitResult({
          success: true,
          message: `Notification sent successfully to ${walletAddresses.length} wallet(s)`,
        });
        reset();
        setCsvImportStatus({ status: "idle", message: "" });
      } else {
        setSubmitResult({
          success: false,
          message: result.error?.detail || "Failed to send notification",
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while sending notification",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="my-8 grid gap-y-6">
      <div className="grid max-w-2xl gap-y-4">
        <Notification variant="info">
          <div className="text-sm">
            <h3 className="font-medium text-blue-800">Notifications</h3>
            <div className="mt-2 text-blue-700">
              Send notifications to specific wallet addresses. Unverified apps
              are limited to 40 notifications per 4 hours.{" "}
              <a
                href="https://docs.world.org/mini-apps/commands/send-notifications"
                target="_blank"
                className="underline"
                rel="noopener noreferrer"
              >
                Docs reference
              </a>
            </div>
          </div>
        </Notification>

        {submitResult && (
          <Notification variant={submitResult.success ? "info" : "warning"}>
            <div className="text-sm">
              <h3
                className={`font-medium ${submitResult.success ? "text-blue-800" : "text-yellow-800"}`}
              >
                {submitResult.success ? "Success" : "Error"}
              </h3>
              <div
                className={`mt-2 ${submitResult.success ? "text-blue-700" : "text-yellow-700"}`}
              >
                {submitResult.message}
              </div>
            </div>
          </Notification>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-y-4">
          <div className="grid gap-y-2">
            <div className="flex items-center justify-between">
              <Typography variant={TYPOGRAPHY.M4}>Wallet Addresses</Typography>
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
                  className="py-1.5"
                >
                  Import CSV
                </DecoratedButton>
                {walletAddressesValue && (
                  <DecoratedButton
                    type="button"
                    variant="secondary"
                    onClick={handleClearAddresses}
                    className="py-1.5"
                  >
                    Clear All
                  </DecoratedButton>
                )}
              </div>
            </div>

            {csvImportStatus.status !== "idle" && (
              <Notification
                variant={
                  csvImportStatus.status === "success" ? "info" : "warning"
                }
              >
                <div className="text-sm">
                  <div
                    className={
                      csvImportStatus.status === "success"
                        ? "text-blue-700"
                        : "text-yellow-700"
                    }
                  >
                    {csvImportStatus.message}
                  </div>
                </div>
              </Notification>
            )}

            <TextArea
              label=""
              register={register("walletAddresses", {
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
              placeholder="Enter wallet addresses separated by commas"
              errors={errors.walletAddresses}
              helperText={`${walletAddressesValue?.split(",").filter((addr) => addr.trim()).length || 0}/1000 addresses - Enter one or more wallet addresses, separated by commas`}
              rows={4}
            />
          </div>

          <Input
            label="Title (Optional)"
            register={register("title", {
              maxLength: {
                value: 30,
                message: "Title cannot exceed 30 characters",
              },
            })}
            placeholder="Notification title"
            errors={errors.title}
            helperText={`${titleValue?.length || 0}/30 characters`}
          />

          <TextArea
            label="Message"
            register={register("message", {
              required: "Message is required",
              maxLength: {
                value: 200,
                message: "Message cannot exceed 200 characters",
              },
            })}
            placeholder="Enter notification message"
            errors={errors.message}
            helperText={`${messageValue?.length || 0}/200 characters`}
            rows={3}
          />

          <Input
            label="Mini App Path"
            register={register("miniAppPath", {
              required: "Mini App Path is required",
            })}
            placeholder="Enter the path inside your mini app"
            errors={errors.miniAppPath}
            helperText="The path inside your mini app that will open when the notification is tapped"
          />

          <Input
            label="API Key"
            register={register("apiKey", {
              required: "API Key is required",
            })}
            placeholder="Enter your API key"
            errors={errors.apiKey}
            helperText="Your Developer Portal API key (format: api_...). Obtain it from the API Keys tab."
          />

          <div className="mt-4 flex justify-end">
            <DecoratedButton
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Send Notification
            </DecoratedButton>
          </div>
        </form>
      </div>
    </div>
  );
};
