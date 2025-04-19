import { GraphsSection } from "./GraphsSection";
import { StatCardGlobalRanking } from "./StatCardGlobalRanking";
import { StatCards } from "./StatCards";


export const AppStatsGraph = ({ appId }: { appId: string }) => {
  return (
    <div className="grid gap-y-6">
      <StatCardGlobalRanking appId={appId} />
      <StatCards appId={appId} />
      <GraphsSection />
    </div>
  );
};
