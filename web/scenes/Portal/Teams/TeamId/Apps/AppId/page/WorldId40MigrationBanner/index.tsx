"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  isWorldId40Enabled,
  worldId40Atom,
} from "@/lib/feature-flags/world-id-4-0/client";
import { CreateAppDialogV4 } from "@/scenes/Portal/layout/CreateAppDialog/index-v4";
import { useAtomValue } from "jotai";
import { useState } from "react";

interface WorldId40MigrationBannerProps {
  teamId: string;
  appId: string;
  hasRpRegistration: boolean;
}

export const WorldId40MigrationBanner = ({
  teamId,
  appId,
  hasRpRegistration,
}: WorldId40MigrationBannerProps) => {
  const worldId40Config = useAtomValue(worldId40Atom);
  const isEnabled = isWorldId40Enabled(worldId40Config, teamId);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Don't show banner if:
  // - World ID 4.0 is not enabled for this team, OR
  // - App already has RP registration
  if (!isEnabled || hasRpRegistration) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#E6F0FF] shadow-[0px_1px_2px_0px_rgba(11,25,40,0.08)]">
      {/* Left side - gradient with diagonal edge (27.17deg) */}
      <div
        className="absolute inset-y-0 left-0 w-[65%] bg-gradient-to-r from-[#E6F0FF] to-[#F3F8FF]"
        style={{
          clipPath: "polygon(0 0, 100% 0, calc(100% - 50px) 100%, 0 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative flex items-center justify-between p-10">
        <div className="flex flex-col gap-1">
          <Typography variant={TYPOGRAPHY.H6} className="text-gray-900">
            Enable World ID 4.0
          </Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-gray-500">
            Upgrade your app to use World ID 4.0.
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <DecoratedButton
            type="button"
            onClick={() => setDialogOpen(true)}
            variant="primary"
            className="h-12 rounded-[10px] border-transparent outline outline-1 outline-offset-[-1px] outline-white/20"
          >
            Get started
          </DecoratedButton>

          <DecoratedButton
            href="https://world.org/blog/engineering/introducing-world-id-4.0"
            variant="secondary"
            className="h-12 rounded-[10px] border-transparent outline outline-1 outline-offset-[-1px] outline-white/20"
          >
            Learn more
          </DecoratedButton>
        </div>
      </div>

      <CreateAppDialogV4
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialStep="enable-world-id-4-0"
        appId={appId}
      />
    </div>
  );
};
