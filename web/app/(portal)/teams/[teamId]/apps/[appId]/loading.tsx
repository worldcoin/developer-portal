import { AppDashboardSkeleton } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Loading";

// Rendered as the Suspense fallback for this segment during navigation.
export default function Loading() {
    return <AppDashboardSkeleton />;
}