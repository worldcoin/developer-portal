import { generateMetaTitle } from "@/lib/genarate-title";
import { UnauthorizedPage } from "@/scenes/Unauthorized/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Unauthorized" }),
};

// Next 16: searchParams is a Promise — resolve it before handing it to the scene component.
export default async function Page(props: {
  searchParams: Promise<Record<string, string>>;
}) {
  return <UnauthorizedPage searchParams={await props.searchParams} />;
}
