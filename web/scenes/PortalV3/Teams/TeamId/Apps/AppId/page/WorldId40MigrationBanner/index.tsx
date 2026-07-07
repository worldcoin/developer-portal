"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useParams } from "next/navigation";

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
  const { teamId } = useParams() as { teamId: string };

  // Don't show banner if:
  // - App already has RP registration, OR
  // - App is a staging app, OR
  // - User lacks ADMIN/OWNER role (register_rp Hasura action would
  //   reject with `unauthorized` and surface a generic toast).
  if (hasRpRegistration || isStaging || !canRegisterRp) {
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
          {/* The v3 create dialog is create-only; existing-app enablement goes
              through the same route the World ID tab redirects to when an app
              has no rp_registration. */}
          <DecoratedButton
            href={urls.enableWorldId4({ team_id: teamId, app_id: appId })}
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
    </div>
  );
};
