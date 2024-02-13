import { generateMetaTitle } from "@/lib/genarate-title";
import { SignInWithWorldIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/SignInWithWorldId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Sign in with World ID" }),
};

export default SignInWithWorldIdPage;
