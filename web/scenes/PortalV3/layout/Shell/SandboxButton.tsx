"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import QRCode from "react-qr-code";
import { useState } from "react";
import { toast } from "react-toastify";

/** Static distribution links for the sandbox builds. Update here only. */
const IOS_TESTFLIGHT_URL = "https://testflight.apple.com/join/VZEurhHe";
// Google Play internal test: works only for Google accounts already on the
// internal-tester allowlist (managed in Play Console, outside this repo).
const ANDROID_URL: string | null =
  "https://play.google.com/apps/internaltest/4701115249455610230";
/** TestFlight's own App Store page, for testers who don't have it yet. */
const TESTFLIGHT_APP_STORE_URL =
  "https://apps.apple.com/app/testflight/id899247664";

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
      "Once approved, scan the QR code",
      "Join the internal test and install the build",
    ],
  },
};

const PLATFORM_ORDER: readonly Platform[] = ["ios", "android"];

/**
 * Sidebar entry point for the World ID sandbox. Purely a distribution
 * shortcut: a modal with a QR code and store links for the sandbox builds.
 * No backend, no per-user state.
 */
export const SandboxButton = (props: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("ios");
  const active = PLATFORMS[platform];
  const { user } = useUser() as Auth0SessionUser;
  const { teamId } = useParams<{ teamId?: string }>();

  // null = form collapsed; a string = form open with that value in the field.
  const [requestEmail, setRequestEmail] = useState<string | null>(null);
  const [requestSending, setRequestSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const submitAccessRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requestSending || !requestEmail || !teamId) return;

    setRequestSending(true);
    try {
      const response = await fetch("/api/v2/sandbox-access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: requestEmail, teamId }),
      });

      if (!response.ok) {
        toast.error("Couldn't send your request — please try again.");
        return;
      }

      posthog.capture("sandbox_access_requested", { platform: "android" });
      setRequestSent(true);
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
          "group relative flex shrink-0 items-center gap-x-3 overflow-hidden rounded-[10px] bg-grey-900 p-3 text-left outline-hidden transition-shadow hover:shadow-portal-card focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:ring-offset-portal-canvas",
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
                    "flex h-8 items-center justify-center rounded-8 px-5 outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-grey-300",
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
                  link works.{" "}
                  {requestEmail === null && !requestSent ? (
                    <button
                      type="button"
                      onClick={() => setRequestEmail(user?.email ?? "")}
                      className="hover:text-grey-600 text-grey-900 underline underline-offset-2 transition-colors"
                    >
                      Request access
                    </button>
                  ) : null}
                </Typography>

                {requestSent ? (
                  <Typography
                    variant={TYPOGRAPHY.M4}
                    className="mt-2 block text-grey-900"
                  >
                    Request sent — you&apos;ll get an email at {requestEmail}{" "}
                    once you&apos;re approved.
                  </Typography>
                ) : requestEmail !== null ? (
                  <form
                    className="mt-3 flex flex-wrap items-center gap-2"
                    onSubmit={submitAccessRequest}
                  >
                    <input
                      type="email"
                      required
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      aria-label="Google account email"
                      placeholder="google-account@gmail.com"
                      className="h-9 min-w-0 flex-1 rounded-8 border border-grey-200 bg-white px-3 font-world text-14 text-grey-900 outline-hidden focus:ring-2 focus:ring-grey-300"
                    />
                    <DecoratedButton
                      type="submit"
                      variant="primary"
                      loading={requestSending}
                      className="h-9 shrink-0 px-4"
                    >
                      <Typography variant={TYPOGRAPHY.M4}>
                        Send request
                      </Typography>
                    </DecoratedButton>
                  </form>
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
                {platform === "ios" ? (
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
