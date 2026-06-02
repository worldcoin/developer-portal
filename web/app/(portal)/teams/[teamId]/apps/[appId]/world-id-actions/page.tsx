import { WorldIdActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/page";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return <WorldIdActionsPage params={params} searchParams={searchParams} />;
}
