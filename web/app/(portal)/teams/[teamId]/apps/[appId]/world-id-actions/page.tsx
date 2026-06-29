import { WorldIdActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/page";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  return <WorldIdActionsPage params={params} searchParams={searchParams} />;
}
