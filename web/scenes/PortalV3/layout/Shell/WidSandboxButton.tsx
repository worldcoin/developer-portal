"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { useState } from "react";
import { toast } from "react-toastify";
import { sidebarNavItemClassName } from "./NavItem";

/** What the button sends to the backend. */
type WidSandboxRequest = {
  app_id: string;
  team_id: string;
  enabled: boolean;
};

/** What the backend returns — keep this in sync with the API route. */
type WidSandboxResponse = {
  success: boolean;
  enabled: boolean;
  message?: string;
};

type WidSandboxButtonProps = {
  appId: string;
  teamId: string;
};

const ENDPOINT = "/api/v2/wid-sandbox";

/**
 * Sidebar control that opens a confirm modal, then toggles WID sandbox.
 * Modal stays in this file while it's small; extract if it grows or is reused.
 */
export const WidSandboxButton = ({
  appId,
  teamId,
}: WidSandboxButtonProps) => {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;

    const nextEnabled = !enabled;
    const body: WidSandboxRequest = {
      app_id: appId,
      team_id: teamId,
      enabled: nextEnabled,
    };

    setLoading(true);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = (await response.json()) as WidSandboxResponse;

      if (!response.ok || !result.success) {
        toast.error(result.message ?? "Failed to update WID sandbox");
        return;
      }

      setEnabled(result.enabled);
      setOpen(false);
      toast.success(
        result.enabled ? "WID sandbox enabled" : "WID sandbox disabled",
      );
    } catch {
      toast.error("Failed to update WID sandbox");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-pressed={enabled}
        className={sidebarNavItemClassName({
          active: enabled,
          className: "w-full text-left",
        })}
      >
        <Icon name="nav-world-id" className="size-4" />
        <span className="min-w-0 flex-1 truncate">
          {enabled ? "Sandbox on" : "Enable sandbox"}
        </span>
      </button>

      <Dialog open={open} onClose={() => !loading && setOpen(false)}>
        <DialogOverlay />
        <DialogPanel className="gap-y-5 md:max-w-xl">
          <div className="grid gap-y-10">
            <div className="grid grid-cols-1 justify-items-center gap-y-4">
              <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
                {enabled ? "Disable WID sandbox?" : "Enable WID sandbox?"}
              </Typography>
              <Typography
                variant={TYPOGRAPHY.R3}
                className="text-center text-grey-500"
              >
                {enabled
                  ? "This app will stop using the sandbox verification environment."
                  : "This app will use the sandbox verification environment for World ID."}
              </Typography>
            </div>
            <div className="grid w-full gap-4 md:grid-cols-2">
              <DecoratedButton
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => setOpen(false)}
              >
                Cancel
              </DecoratedButton>
              <DecoratedButton
                type="button"
                variant="primary"
                loading={loading}
                onClick={() => void submit()}
              >
                {enabled ? "Disable" : "Enable"}
              </DecoratedButton>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
};
