import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamDangerPage } from "@/scenes/Portal/Teams/TeamId/Team/Danger/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default TeamDangerPage;
