"use client";

import { Button } from "@/components/Button";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { CreateAppDialogV4 } from "@/scenes/PortalV3/layout/CreateAppDialog/index-v4";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface WorldId40MigrationBannerProps {
  appId: string;
  hasRpRegistration: boolean;
  canRegisterRp: boolean;
  isStaging: boolean;
}

export const WorldId40MigrationBanner = ({
  appId,
  hasRpRegistration,
  canRegisterRp,
  isStaging,
}: WorldId40MigrationBannerProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const autoOpen = searchParams.get("enableWorldId4") === "true";
  const [dialogOpen, setDialogOpen] = useState(autoOpen && canRegisterRp);

  useEffect(() => {
    if (autoOpen && canRegisterRp) setDialogOpen(true);
  }, [autoOpen, canRegisterRp]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);

    // Strip the `enableWorldId4` param so the World ID tab link returns to its
    // clean state. Otherwise the URL keeps the param and clicking the tab again
    // is a no-op (same URL), leaving the user unable to re-open the flow.
    if (searchParams.has("enableWorldId4")) {
      const params = new URLSearchParams(searchParams);
      params.delete("enableWorldId4");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }
  }, [pathname, router, searchParams]);

  // Don't show banner if:
  // - App already has RP registration, OR
  // - App is a staging app, OR
  // - User lacks ADMIN/OWNER role (register_rp Hasura action would
  //   reject with `unauthorized` and surface a generic toast).
  if (hasRpRegistration || isStaging || !canRegisterRp) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-[10px] bg-portal-accent p-5 md:flex-row md:items-center">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-additional-blue-600 text-white">
        <Icon name="credential-banner" className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-world text-19 font-medium leading-[1.2] text-portal-text">
          Enable World ID 4.0
        </div>
        <div className="mt-1 font-world text-13 leading-[1.3] text-portal-text">
          Let users sign in to your app with their World ID.
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-wrap items-center gap-2 md:w-auto">
        <Button
          href="https://world.org/blog/engineering/introducing-world-id-4.0"
          className="flex h-10 items-center justify-center rounded-[20px] px-5 font-world text-15 font-medium leading-none text-portal-ink transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-portal-accent-ring"
        >
          Learn more
        </Button>

        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex h-10 items-center justify-center rounded-8 bg-portal-ink px-5 font-world text-15 font-medium leading-none text-white transition-colors hover:bg-portal-ink-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-portal-accent-ring"
        >
          Get started
        </Button>
      </div>

      <CreateAppDialogV4
        open={dialogOpen}
        onClose={closeDialog}
        initialStep="enable-world-id-4-0"
        appId={appId}
      />
    </div>
  );
};
