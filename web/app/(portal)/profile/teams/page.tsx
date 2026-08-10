import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Teams" }),
};

export default async function Page() {
  return redirect(urls.profile());
}
