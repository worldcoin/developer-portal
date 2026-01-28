import { generateMetaTitle } from "@/lib/genarate-title";
import { EnableWorldId40Page } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/EnableWorldId40/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Enable World ID 4.0" }),
};

export default function EnableWorldId40RoutePage() {
  return <EnableWorldId40Page />;
}
