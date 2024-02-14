import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamIdPage } from "@/scenes/Portal/Teams/TeamId/Team/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

export default TeamIdPage;
