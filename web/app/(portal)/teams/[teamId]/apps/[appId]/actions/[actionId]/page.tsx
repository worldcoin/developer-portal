import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

export default ActionIdPage;
