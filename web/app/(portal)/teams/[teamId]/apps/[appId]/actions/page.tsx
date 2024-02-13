import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Incognito actions" }),
};

export default ActionsPage;
