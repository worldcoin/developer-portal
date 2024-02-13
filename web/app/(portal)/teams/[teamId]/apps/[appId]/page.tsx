import { generateMetaTitle } from "@/lib/genarate-title";
import { AppIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Dashboard" }),
};

export default AppIdPage;
