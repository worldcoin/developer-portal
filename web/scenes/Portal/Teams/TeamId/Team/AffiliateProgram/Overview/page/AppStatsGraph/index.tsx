import { GraphsSection } from "./GraphsSection";
import { StatCards } from "./StatCards";

export const AppStatsGraph = ({ appId }: { appId: string }) => {
  return (
    <div className="grid gap-y-6">
      <StatCards appId={appId} />
      <GraphsSection />
    </div>
  );
};
