import { generateMetaTitle } from "@/lib/genarate-title";
import { AppsPage } from "@/scenes/Portal/Teams/TeamId/Team/Apps/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Apps" }),
};

export default AppsPage;
