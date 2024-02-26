import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamsPage } from "@/scenes/Portal/Profile/Teams/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Teams" }),
};

export default TeamsPage;
