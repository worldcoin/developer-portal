import { redirect } from "next/navigation";

type Props = {
  params: {
    teamId: string;
    appId: string;
  };
};

export default function LegacyNotificationsPage({ params }: Props) {
  redirect(
    `/teams/${params.teamId}/apps/${params.appId}/mini-app/notifications`,
  );
}
