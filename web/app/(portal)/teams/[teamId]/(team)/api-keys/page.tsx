import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamApiKeysPage } from "@/scenes/Portal/Teams/TeamId/Team/ApiKeys/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "API keys" }),
};

export default TeamApiKeysPage;
