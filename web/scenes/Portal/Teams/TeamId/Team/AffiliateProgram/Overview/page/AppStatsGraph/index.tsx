import { GraphsSection } from "./GraphsSection";

export const AppStatsGraph = ({ appId }: { appId: string }) => {
  return (
    <div className="grid gap-y-6">
      <GraphsSection />
    </div>
  );
};
