import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdDangerPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default ActionIdDangerPage;
