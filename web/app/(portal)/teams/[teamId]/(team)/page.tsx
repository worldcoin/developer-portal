import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamIdPage } from "@/scenes/Portal/Teams/TeamId/Team/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

// Next 16: params/searchParams are Promises. Resolve them here and pass the plain
// objects to the scene component (the await-wrapper pattern used across the app).
export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  return <TeamIdPage params={params} searchParams={searchParams} />;
}
