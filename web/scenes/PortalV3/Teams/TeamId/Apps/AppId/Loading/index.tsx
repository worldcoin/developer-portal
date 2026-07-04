import { SizingWrapper } from "@/components/SizingWrapper";
import Skeleton from "react-loading-skeleton";

/** Fallback shown the instant a user navigates to the app dashboard, while the
 *  server render (auth + FetchAppEnv) resolves. Mirrors AppIdPage's layout so
 *  the swap to real content doesn't shift. */
export const AppDashboardSkeleton = () => (
  <SizingWrapper className="flex flex-col gap-y-8 py-4">
    {/* status rows (VerificationStatusSection + BanStatusSection) */}
    <div className="grid gap-y-3">
      <Skeleton height={64} borderRadius={12} />
    </div>

    {/* "Overview" header + TimePeriodSelector */}
    <div className="flex items-center justify-between">
      <Skeleton width={110} height={24} />
      <Skeleton width={180} height={36} borderRadius={8} />
    </div>

    {/* AppStatsGraph — stat row + chart */}
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} height={88} borderRadius={12} />
      ))}
    </div>
    <Skeleton height={320} borderRadius={12} />
  </SizingWrapper>
);
