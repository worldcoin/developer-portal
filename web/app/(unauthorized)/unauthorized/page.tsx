import { generateMetaTitle } from "@/lib/genarate-title";
import { Unauthorized } from "@/scenes/Unauthorized/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Unauthorized" }),
};

export default Unauthorized;
