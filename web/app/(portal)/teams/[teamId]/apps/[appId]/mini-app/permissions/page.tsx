import { generateMetaTitle } from "@/lib/genarate-title";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Permissions" }),
};

export default function Page() {
  return redirect("../develop");
}
