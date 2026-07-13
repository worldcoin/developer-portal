import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { MultiplePlusIcon } from "@/components/Icons/MultiplePlusIcon";
import { Link } from "@/components/Link";
import { urls } from "@/lib/urls";
import { ReactNode } from "react";

interface QuickActionsSectionProps {
  appId: string;
  teamId: string;
}

const QuickActionCard = (props: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) => (
  <Link
    href={props.href}
    className="flex items-start gap-4 rounded-[10px] border border-portal-border bg-white p-6 transition-colors hover:border-grey-300"
  >
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-portal-canvas text-portal-ink">
      {props.icon}
    </span>
    <span className="min-w-0">
      <span className="block font-world text-15 leading-[1.3] font-medium text-portal-text">
        {props.title}
      </span>
      <span className="mt-1 block font-world text-13 leading-[1.4] text-portal-muted">
        {props.description}
      </span>
    </span>
  </Link>
);

export const QuickActionsSection = ({
  appId,
  teamId,
}: QuickActionsSectionProps) => {
  return (
    <div className="grid gap-y-4">
      <h2 className="font-world text-17 leading-[1.2] font-medium text-portal-heading">
        Quick actions
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickActionCard
          href={`${urls.worldIdActions({ team_id: teamId, app_id: appId })}?createAction=true`}
          icon={<MultiplePlusIcon className="size-5" />}
          title="Create an action"
          description="Verify users as unique humans"
        />

        <QuickActionCard
          href={urls.configuration({ team_id: teamId, app_id: appId })}
          icon={<CheckmarkBadge className="size-5" />}
          title="Get your app verified"
          description="Verified apps get more users."
        />
      </div>
    </div>
  );
};
