import { ArrowUpIcon } from "@/components/Icons/ArrowUpIcon";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { MultiplePlusIcon } from "@/components/Icons/MultiplePlusIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import Link from "next/link";
import { ReactNode } from "react";

interface QuickActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
}

const QuickActionCard = ({
  icon,
  title,
  description,
  href,
}: QuickActionCardProps) => {
  return (
    <Link
      href={href}
      className="group flex h-24 items-end justify-between rounded-2xl border border-gray-200 bg-white p-6 transition-colors hover:border-blue-500"
    >
      <div className="flex items-center gap-x-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-sky-100 text-blue-600">
          {icon}
        </div>

        <div className="flex flex-col">
          <Typography variant={TYPOGRAPHY.M3} className="text-zinc-700">
            {title}
          </Typography>
          <Typography variant={TYPOGRAPHY.R5} className="text-gray-500">
            {description}
          </Typography>
        </div>
      </div>

      <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors group-hover:border-blue-500">
        <ArrowUpIcon className="rotate-45 text-gray-400 transition-colors group-hover:text-blue-500" />
      </div>
    </Link>
  );
};

interface QuickActionsSectionProps {
  appId: string;
  teamId: string;
}

export const QuickActionsSection = ({
  appId,
  teamId,
}: QuickActionsSectionProps) => {
  return (
    <div className="grid gap-y-6">
      <Typography variant={TYPOGRAPHY.H7}>Quick actions</Typography>

      <div className="grid gap-6 lg:grid-cols-3">
        <QuickActionCard
          icon={<MultiplePlusIcon className="size-5" />}
          title="Create an action"
          description="Verify users as unique humans"
          href={urls.createAction({ team_id: teamId, app_id: appId })}
        />

        <QuickActionCard
          icon={<CheckmarkBadge className="size-5" />}
          title="Get your app verified"
          description="Verified apps get more users."
          href={urls.configuration({ team_id: teamId, app_id: appId })}
        />
      </div>
    </div>
  );
};
