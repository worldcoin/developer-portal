import { OnboardingLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/OnboardingLayout";
import { ReactNode } from "react";

export default function OnboardingRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OnboardingLayout title="Enable World ID 4.0" showCloseButton={false}>
      {children}
    </OnboardingLayout>
  );
}
