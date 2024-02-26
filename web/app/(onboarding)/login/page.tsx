import { generateMetaTitle } from "@/lib/genarate-title";
import { LoginPage } from "@/scenes/Onboarding/Login/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Login" }),
};

export default LoginPage;
