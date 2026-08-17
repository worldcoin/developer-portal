import { generateMetaTitle } from "@/lib/generate-title";
import { ActionIdProofDebugingPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/ProofDebuging/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Proof debuging" }),
};

export default ActionIdProofDebugingPage;
