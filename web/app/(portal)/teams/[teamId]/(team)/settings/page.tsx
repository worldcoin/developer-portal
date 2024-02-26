import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamSettingsPage } from "@/scenes/Portal/Teams/TeamId/Team/Settings/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Team settings" }),
};

export default TeamSettingsPage;
