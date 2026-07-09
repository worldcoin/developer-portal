import { UIModule } from "@/components/AdminDashboard/UIModule";

type AdminTeamPageProps = {
  teamId: string;
};

export const AdminTeamPage = ({ teamId }: AdminTeamPageProps) => {
  return (
    <div className="grid h-full min-h-0 grid-rows-auto/1fr gap-y-4">
      <UIModule className="p-4">
        <h1 className="text-lg font-medium">Team</h1>
        <div className="truncate font-mono text-sm text-grey-500">{teamId}</div>
      </UIModule>

      <UIModule className="grid min-h-0 place-items-center p-4">
        <div className="text-center text-sm text-grey-500">
          Team details will be added here.
        </div>
      </UIModule>
    </div>
  );
};
