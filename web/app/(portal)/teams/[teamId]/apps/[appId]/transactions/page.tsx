import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    teamId: string;
    appId: string;
  }>;
};

export default async function LegacyTransactionsPage(props: Props) {
  const params = await props.params;
  redirect(
    `/teams/${params.teamId}/apps/${params.appId}/mini-app/transactions`,
  );
}
