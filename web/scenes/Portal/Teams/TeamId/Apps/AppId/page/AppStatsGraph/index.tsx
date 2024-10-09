import { Graphs } from "./Graphs";
import { StatCardGlobalRanking } from "./StatCardGlobalRanking";

export const AppStatsGraph = ({ appId }: { appId: string }) => {
  return (
    <div className="grid gap-y-6">
      <StatCardGlobalRanking appId={appId} />
      <Graphs />
    </div>
  );
};
