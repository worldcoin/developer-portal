import { generateMetaTitle } from "@/lib/genarate-title";
import { CreateTeamPage } from "@/scenes/Onboarding/CreateTeam/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Create team" }),
};

export default CreateTeamPage;
