import { generateMetaTitle } from "@/lib/genarate-title";
import { SignInWithWorldIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/SignInWithWorldId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Sign in with World ID" }),
};

// Next 16: params is a Promise — resolve it before handing it to the scene component.
export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <SignInWithWorldIdPage params={await props.params} />;
}
