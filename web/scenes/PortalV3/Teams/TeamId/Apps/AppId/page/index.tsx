import { AddCircleIcon } from "@/components/Icons/AddCircleIcon";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { OutgoingLinkIcon } from "@/components/Icons/OutgoingLink";
import { urls } from "@/lib/urls";
import { fetchAppEnvCached } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import Link from "next/link";

const metrics = [
  ["Impressions", "0"],
  ["Sessions", "0"],
  ["Users", "0"],
  ["New users", "0"],
];

const tabs = ["Verifications", "Payments", "Notifications"];

export const AppIdPage = async (props: {
  params: Promise<{
    teamId: string;
    appId: string;
  }>;
}) => {
  const { teamId, appId } = await props.params;
  await fetchAppEnvCached(appId);

  const quickActions = [
    {
      title: "Create an action",
      description: "Verify users as unique humans",
      href: urls.worldIdActions({ team_id: teamId, app_id: appId }),
      icon: <AddCircleIcon className="size-5" />,
    },
    {
      title: "Get your app verified",
      description: "Verified apps get more users.",
      href: urls.configuration({ team_id: teamId, app_id: appId }),
      icon: <CheckmarkBadge className="size-5" />,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-8 py-8">
      <section className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-gta text-24 font-medium text-foreground">
            Overview
          </h1>
          <button
            type="button"
            className="flex h-10 items-center gap-3 rounded-8 border border-border bg-card px-4 font-gta text-14 font-medium text-muted-foreground"
          >
            Weekly
            <CaretIcon className="size-3" />
          </button>
        </div>

        <div className="flex flex-wrap gap-8 font-gta">
          {metrics.map(([label, value], index) => (
            <div key={label} className="flex items-center gap-8">
              <div>
                <div className="text-12 font-medium text-faint-foreground">
                  {label}
                </div>
                <div className="text-24 font-medium text-foreground">
                  {value}
                </div>
              </div>
              {index < metrics.length - 1 ? (
                <div className="h-6 w-px bg-border" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex gap-6 border-b border-border font-gta text-14 font-medium">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={
                index === 0
                  ? "-mb-px border-b-2 border-foreground pb-3 text-foreground"
                  : "pb-3 text-muted-foreground"
              }
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex min-h-[320px] items-center justify-center rounded-16 border border-border">
          <div className="text-center font-gta">
            <div className="text-20 font-medium text-muted-foreground">
              No available data
            </div>
            <div className="mt-2 text-14 text-faint-foreground">
              Your data will show up here
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-gta text-18 font-medium text-foreground">
          Quick actions
        </h2>
        <div className="grid max-w-[760px] grid-cols-2 gap-5">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="flex items-center justify-between rounded-16 border border-border p-5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent">
                  {action.icon}
                </div>
                <div className="min-w-0 font-gta">
                  <div className="truncate text-16 font-medium text-foreground">
                    {action.title}
                  </div>
                  <div className="truncate text-13 text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </div>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                <OutgoingLinkIcon className="size-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
