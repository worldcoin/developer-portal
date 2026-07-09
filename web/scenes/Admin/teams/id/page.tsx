import { UIModule } from "@/components/AdminDashboard/UIModule";

type AdminTeamPageProps = {
  teamId: string;
};

export const AdminTeamPage = ({ teamId }: AdminTeamPageProps) => {
  return (
    <div className="grid h-full min-h-0 grid-rows-auto/1fr gap-y-4">
      <UIModule className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="mb-2 text-12 font-medium uppercase tracking-wide text-grey-400">
              Admin / Teams
            </div>
            <h1 className="text-24 font-semibold tracking-[-0.02em] text-grey-900">
              Team details
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Review team-level information, usage, and related resources.
            </p>
          </div>

          <div className="min-w-0 rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium uppercase tracking-wide text-grey-400">
              Team ID
            </div>
            <div className="mt-1 truncate font-mono text-13 font-medium text-grey-900">
              {teamId}
            </div>
          </div>
        </div>
      </UIModule>

      <UIModule className="grid min-h-0 place-items-center p-4">
        <div className="text-center text-sm text-grey-500">
          Team details will be added here.
        </div>
      </UIModule>
    </div>
  );
};
