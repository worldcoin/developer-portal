import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdProofDebugingPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/ProofDebuging/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Proof debuging" }),
};

export default ActionIdProofDebugingPage;
