import { generateMetaTitle } from "@/lib/genarate-title";
import { ConfigureSignerKeyPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/ConfigureSignerKey/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Configure Signer Key" }),
};

export default function ConfigureSignerKeyRoutePage() {
  return <ConfigureSignerKeyPage />;
}
