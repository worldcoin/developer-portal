import { generateMetaTitle } from "@/lib/generate-title";
import { WorldIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "World ID" }),
};

export default function Page() {
  return <WorldIdPage />;
}
