import { CaretIcon } from "@/components/Icons/CaretIcon";
import clsx from "clsx";

export type DashboardStat = { label: string; value: string };

const QUICK_ACTIONS = [
  { title: "Create an action", detail: "Verify users as unique humans" },
  { title: "Get your app verified", detail: "Verified apps get more users" },
];

const TABS = ["Verifications", "Payments", "Notifications"];

/**
 * App overview page (presentational), Vercel-style: a KPI stat strip, a tabbed
 * data panel with an empty state, and quick-action cards. Data is wired by a
 * container later; this renders the look on the v3 tokens.
 */
export const DashboardView = (props: { stats: DashboardStat[] }) => {
  return (
    <div className="mx-auto max-w-[960px] px-6 py-7">
      <h1 className="font-twk text-24 font-medium">Overview</h1>

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-12 border border-border bg-border sm:grid-cols-4">
        {props.stats.map((stat) => (
          <div key={stat.label} className="bg-card p-4">
            <div className="text-12 text-muted-foreground">{stat.label}</div>
            <div className="mt-1 font-gta text-24 font-medium">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-12 border border-border bg-card">
        <div className="flex gap-5 border-b border-border px-5">
          {TABS.map((tab, i) => (
            <span
              key={tab}
              className={clsx(
                "-mb-px border-b-2 py-3 text-14",
                i === 0
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="flex h-52 flex-col items-center justify-center gap-1 text-center">
          <div className="font-gta text-14 font-medium">No data yet</div>
          <div className="text-13 text-muted-foreground">
            Verifications will show up here once your app is live.
          </div>
        </div>
      </div>

      <h2 className="mt-8 font-gta text-16 font-medium">Quick actions</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.title}
            type="button"
            className="flex items-center justify-between gap-3 rounded-12 border border-border bg-card p-4 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>
              <span className="block font-gta text-14 font-medium">
                {action.title}
              </span>
              <span className="mt-0.5 block text-13 text-muted-foreground">
                {action.detail}
              </span>
            </span>
            <CaretIcon className="size-3 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};
