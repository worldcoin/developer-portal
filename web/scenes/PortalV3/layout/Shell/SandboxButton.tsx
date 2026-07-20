"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import posthog from "posthog-js";
import QRCode from "react-qr-code";
import { useState } from "react";

/** Static distribution links for the sandbox builds. Update here only. */
const IOS_TESTFLIGHT_URL = "https://testflight.apple.com/join/VZEurhHe";
// TODO: set once the Android build has a link; null renders a "coming soon" state.
const ANDROID_URL: string | null = null;

const INSTALL_STEPS = [
  "Open the camera on your iPhone",
  "Scan the QR code",
  "Join TestFlight and install the build",
] as const;

const StoreLink = (props: {
  platform: "ios" | "android";
  url: string;
  children: string;
}) => {
  const { platform, url, children } = props;

  return (
    <DecoratedButton
      href={url}
      variant="secondary"
      className="h-9 w-full px-3 py-1.5"
      onClick={() =>
        posthog.capture("sandbox_store_link_clicked", { platform })
      }
    >
      <Typography variant={TYPOGRAPHY.M4}>{children}</Typography>
    </DecoratedButton>
  );
};

/**
 * Sidebar entry point for the World ID sandbox. Purely a distribution
 * shortcut: a modal with a QR code and store links for the sandbox builds.
 * No backend, no per-user state.
 */
export const SandboxButton = () => {
  const [open, setOpen] = useState(false);

  const openDialog = () => {
    posthog.capture("sandbox_tile_clicked");
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        aria-haspopup="dialog"
        className="group relative mt-6 flex aspect-square w-full shrink-0 flex-col gap-y-0.5 overflow-hidden rounded-[10px] bg-grey-900 p-4 text-left outline-hidden transition-shadow hover:shadow-portal-card focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:ring-offset-portal-canvas"
      >
        {/* Static halftone ground, echoing the landing hero mark. */}
        <div
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.25)_1px,transparent_1.5px)] [background-size:10px_10px]"
        />
        {/* Soft glow in the sandbox icon's purple, anchoring it on the halftone. */}
        <div
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(circle_at_50%_38%,rgba(146,96,247,0.4),transparent_58%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-grey-900 to-transparent"
        />
        <div className="relative flex w-full flex-1 items-center justify-center">
          {/* The sandbox build's actual app icon, so tile → TestFlight → home
              screen all show the same mark. */}
          <Icon
            name="world-id-sandbox-app-icon"
            className="size-14 drop-shadow-md transition-transform duration-200 group-hover:scale-105"
          />
        </div>
        <span className="relative font-world text-14 font-medium text-white">
          World ID Sandbox
        </span>
        <span className="relative font-world text-11 text-grey-400">
          Install the test build
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

            <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
              <ol className="grid gap-y-5">
                {INSTALL_STEPS.map((step, index) => (
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
                <div className="w-full max-w-[236px] rounded-12 bg-grey-50 p-5">
                  <QRCode
                    value={IOS_TESTFLIGHT_URL}
                    size={196}
                    className="h-auto w-full"
                    aria-label="QR code to install the iOS sandbox build"
                  />
                </div>
                <Typography variant={TYPOGRAPHY.S4} className="text-grey-500">
                  iOS · TestFlight
                </Typography>
              </div>
            </div>

            <details className="group rounded-12 bg-grey-50">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-x-4 rounded-12 px-4 py-3 outline-hidden transition-colors select-none hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                <Typography variant={TYPOGRAPHY.M4} className="text-grey-700">
                  Other install options
                </Typography>
                <Typography
                  aria-hidden
                  variant={TYPOGRAPHY.M3}
                  className="text-grey-400 group-open:hidden"
                >
                  +
                </Typography>
                <Typography
                  aria-hidden
                  variant={TYPOGRAPHY.M3}
                  className="hidden text-grey-400 group-open:inline"
                >
                  −
                </Typography>
              </summary>

              <div className="grid gap-y-5 px-4 pt-1 pb-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-0">
                <div className="grid content-start gap-y-2">
                  <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
                    Installing on this iPhone?
                  </Typography>
                  <StoreLink platform="ios" url={IOS_TESTFLIGHT_URL}>
                    Join TestFlight
                  </StoreLink>
                </div>

                <div className="grid content-start gap-y-2">
                  <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
                    Android
                  </Typography>
                  {ANDROID_URL === null ? (
                    <div className="flex h-9 items-center rounded-[10px] bg-grey-100 px-3">
                      <Typography
                        variant={TYPOGRAPHY.R4}
                        className="text-grey-500"
                      >
                        Coming soon
                      </Typography>
                    </div>
                  ) : (
                    <StoreLink platform="android" url={ANDROID_URL}>
                      Get the build
                    </StoreLink>
                  )}
                </div>
              </div>
            </details>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
};
