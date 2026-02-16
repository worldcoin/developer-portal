import type { Metadata } from "next";
import { generateMetaTitle } from "@/lib/genarate-title";
import { SelfManagedRegistrationPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/EnableWorldId40/SelfManagedRegistration/page";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Self-Managed Registration" }),
};

export default function SelfManagedRegistrationRoutePage() {
  return <SelfManagedRegistrationPage />;
}
