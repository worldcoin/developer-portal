import { generateMetaTitle } from "@/lib/genarate-title";
import { RootLayout } from "@/scenes/Root/layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle(),
};

export default RootLayout;
