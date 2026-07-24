"use client";

import type { SandboxAccessRequestState } from "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";

// Distribution links for the sandbox builds. Values come from the deploy
// config (world-id-deploy stacks/web/parameters.ts) and are inlined at build
// time; an unset link degrades to the "coming soon" placeholder below.
const IOS_TESTFLIGHT_URL: string | null =
  process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL || null;
// Google Play internal test: works only for Google accounts already on the
// internal-tester allowlist (managed in Play Console, outside this repo).
const ANDROID_URL: string | null =
  process.env.NEXT_PUBLIC_ANDROID_INTERNAL_TEST_URL || null;
/** TestFlight's own App Store page, for testers who don't have it yet. */
const TESTFLIGHT_APP_STORE_URL: string | null =
  process.env.NEXT_PUBLIC_TESTFLIGHT_APP_STORE_URL || null;

type Platform = "ios" | "android";

const PLATFORMS: Record<
  Platform,
  {
    label: string;
    url: string | null;
    steps: readonly string[];
  }
> = {
  ios: {
    label: "iOS",
    url: IOS_TESTFLIGHT_URL,
    steps: [
      "Open the camera on your iPhone",
      "Scan the QR code",
      "Join TestFlight and install the build",
    ],
  },
  android: {
    label: "Android",
    url: ANDROID_URL,
    steps: [
      "Request access for your Google account",
      "Wait for your invite confirmation",
      "Scan the QR code and install the build",
    ],
  },
};

const PLATFORM_ORDER: readonly Platform[] = ["ios", "android"];

/**
 * Sidebar entry point for the World ID sandbox: a modal with QR codes / store
 * links, plus an Android form that records a Play allowlist request
 * (sandbox_access_request). The caller's request is looked up on open so a
 * past submission renders as a persistent confirmation.
 */
export const SandboxButton = (props: {
  className?: string;
  initialRequest?: SandboxAccessRequestState | null;
}) => {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("ios");
  const active = PLATFORMS[platform];
  const { user } = useUser() as Auth0SessionUser;

  const [requestEmail, setRequestEmail] = useState(
    props.initialRequest?.email ?? user?.email ?? "",
  );
  const [requestSending, setRequestSending] = useState(false);
  const [requestRefreshing, setRequestRefreshing] = useState(false);
  const [existingRequest, setExistingRequest] =
    useState<SandboxAccessRequestState | null>(props.initialRequest ?? null);

  useEffect(() => {
    if (props.initialRequest || !user?.email) return;
    setRequestEmail((current) => current || user.email);
  }, [props.initialRequest, user?.email]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    (async () => {
      setRequestRefreshing(true);
      try {
        const response = await fetch("/api/v2/sandbox-access-request");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setExistingRequest(data.request ?? null);
          if (data.request?.email) {
            setRequestEmail(data.request.email);
          }
        }
      } catch {
      } finally {
        if (!cancelled) setRequestRefreshing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const submitAccessRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requestSending || !requestEmail) return;

    setRequestSending(true);
    try {
      const response = await fetch("/api/v2/sandbox-access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: requestEmail }),
      });

      if (!response.ok) {
        toast.error("Couldn't send your request — please try again.");
        return;
      }

      const data = await response.json();
      if (!data.request) {
        throw new Error("Request state missing from response");
      }

      posthog.capture("sandbox_access_requested", { platform: "android" });
      setExistingRequest(data.request);
      setRequestEmail(data.request.email);
    } catch {
      toast.error("Couldn't send your request — please try again.");
    } finally {
      setRequestSending(false);
    }
  };

  const openDialog = () => {
    posthog.capture("sandbox_tile_clicked");
    setOpen(true);
  };

  const switchPlatform = (next: Platform) => {
    if (next === platform) return;
    posthog.capture("sandbox_platform_switched", { platform: next });
    setPlatform(next);
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        aria-haspopup="dialog"
        className={clsx(
          "group relative flex shrink-0 cursor-pointer items-center gap-x-3 overflow-hidden rounded-[10px] bg-grey-900 p-3 text-left outline-hidden transition-shadow hover:shadow-portal-card focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:ring-offset-portal-canvas",
          props.className,
        )}
      >
        {/* Static halftone ground, echoing the landing hero mark. */}
        <div
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1.5px)] [background-size:10px_10px]"
        />
        {/* Soft glow in the sandbox icon's purple, anchoring it on the halftone. */}
        <div
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(circle_at_12%_50%,rgba(146,96,247,0.4),transparent_45%)]"
        />
        {/* The sandbox build's actual app icon, so banner → TestFlight →
                home screen all show the same mark. */}
        <Icon
          name="world-id-sandbox-app-icon"
          className="relative size-10 shrink-0 drop-shadow-md"
        />
        <span className="relative grid min-w-0 flex-1 gap-y-0.5">
          <span className="font-world text-13 font-medium text-white">
            World ID Sandbox
          </span>
          <span className="font-world text-11 text-grey-400">
            Install the test build
          </span>
        </span>
        <span
          aria-hidden
          className="relative pr-0.5 font-world text-13 text-grey-400 transition-transform duration-200 group-hover:translate-x-0.5"
        >
          →
        </span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogOverlay />
        <DialogPanel className="max-h-[calc(100dvh-2rem)] gap-y-0 overflow-y-auto rounded-12 p-6 sm:p-8 md:w-[680px] md:max-w-[calc(100vw-2rem)] md:rounded-12">
          <div className="grid w-full gap-y-8">
            <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4">
              {/* drop-shadow (not a ring) — it follows the squircle's alpha,
                  so the white icon still reads on the white panel. */}
              <Icon
                name="world-id-sandbox-app-icon"
                className="size-12 drop-shadow-sm"
              />
              <div className="grid gap-y-1">
                <Typography
                  as="h2"
                  variant={TYPOGRAPHY.H6}
                  className="text-grey-900"
                >
                  Install World ID Sandbox
                </Typography>
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                  Test World ID in World App without using production data.
                </Typography>
              </div>
            </header>

            <div
              role="group"
              aria-label="Platform"
              className="grid w-fit grid-cols-2 gap-1 rounded-[10px] bg-grey-100 p-1"
            >
              {PLATFORM_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={platform === p}
                  onClick={() => switchPlatform(p)}
                  className={clsx(
                    "flex h-8 cursor-pointer items-center justify-center rounded-8 px-5 outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-grey-300",
                    platform === p
                      ? "bg-white text-grey-900 shadow-portal-card"
                      : "text-grey-500 hover:text-grey-700",
                  )}
                >
                  <Typography variant={TYPOGRAPHY.M4}>
                    {PLATFORMS[p].label}
                  </Typography>
                </button>
              ))}
            </div>

            {platform === "android" ? (
              <div className="rounded-12 bg-grey-50 px-4 py-3">
                <Typography variant={TYPOGRAPHY.R4} className="text-grey-700">
                  The Android build is distributed as a Google Play internal
                  test — your Google account email must be approved before the
                  link works.
                </Typography>

                <form
                  className="mt-3 flex flex-wrap items-center gap-2"
                  onSubmit={submitAccessRequest}
                >
                  <input
                    type="email"
                    required
                    disabled={existingRequest !== null || requestRefreshing}
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    aria-label="Google account email"
                    placeholder="google-account@gmail.com"
                    className="h-9 min-w-0 flex-1 rounded-8 border border-grey-200 bg-white px-3 font-world text-14 text-grey-900 outline-hidden focus:ring-2 focus:ring-grey-300 disabled:bg-grey-100 disabled:text-grey-500"
                  />
                  <DecoratedButton
                    type="submit"
                    variant="primary"
                    disabled={existingRequest !== null || requestRefreshing}
                    loading={requestSending}
                    className="h-9 shrink-0 px-4"
                  >
                    <Typography variant={TYPOGRAPHY.M4}>
                      {existingRequest?.accepted
                        ? "Invite sent"
                        : existingRequest
                          ? "Request submitted"
                          : "Request invite"}
                    </Typography>
                  </DecoratedButton>
                </form>

                {existingRequest ? (
                  <Typography
                    variant={TYPOGRAPHY.M4}
                    className="mt-2 block text-grey-900"
                  >
                    {existingRequest.accepted ? (
                      <>
                        An invite has been sent to {existingRequest.email}. Scan
                        the QR code to install.
                      </>
                    ) : (
                      <>
                        Your request for {existingRequest.email} is pending.
                        We&apos;ll email you when the invite has been sent.
                      </>
                    )}
                  </Typography>
                ) : null}
              </div>
            ) : null}

            <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
              <ol className="grid gap-y-5">
                {active.steps.map((step, index) => (
                  <li
                    key={step}
                    className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-x-3"
                  >
                    <Typography
                      aria-hidden
                      variant={TYPOGRAPHY.M5}
                      className="flex size-6 items-center justify-center rounded-[10px] border border-grey-200 text-grey-700"
                    >
                      {index + 1}
                    </Typography>
                    <Typography
                      variant={TYPOGRAPHY.R4}
                      className="pt-0.5 text-grey-700"
                    >
                      {step}
                    </Typography>
                  </li>
                ))}
              </ol>

              <div className="grid justify-items-center gap-y-3">
                {active.url ? (
                  <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
                    On the web?{" "}
                    <a
                      href={active.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        posthog.capture("sandbox_store_link_clicked", {
                          platform,
                        })
                      }
                      className="hover:text-grey-600 text-grey-900 underline underline-offset-2 transition-colors"
                    >
                      Click here
                    </a>
                  </Typography>
                ) : null}
                <div className="w-full max-w-[236px] rounded-12 bg-grey-50 p-5">
                  {active.url ? (
                    <QRCode
                      value={active.url}
                      size={196}
                      className="h-auto w-full"
                      aria-label={`QR code to install the ${active.label} sandbox build`}
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-8 border border-dashed border-grey-300">
                      <Typography
                        variant={TYPOGRAPHY.R4}
                        className="text-center text-grey-400"
                      >
                        {active.label} build
                        <br />
                        coming soon
                      </Typography>
                    </div>
                  )}
                </div>
                {platform === "ios" && TESTFLIGHT_APP_STORE_URL ? (
                  <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
                    Installing World ID Sandbox requires{" "}
                    <a
                      href={TESTFLIGHT_APP_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-grey-600 text-grey-900 underline underline-offset-2 transition-colors"
                    >
                      TestFlight
                    </a>
                  </Typography>
                ) : null}
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
};
