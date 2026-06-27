import { auth0 } from "@/lib/auth0";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Login" }),
};

export default async function Page() {
  const session = await auth0.getSession();

  if (session?.user) {
    redirect("/teams");
  }

  redirect(urls.api.authLogin());
}
