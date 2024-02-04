import { AppTopBar } from "../Components/AppTopBar";
import { BasicInformation } from "./BasicInformation";

type AppProfilePageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const AppProfilePage = ({
  params,
  searchParams,
}: AppProfilePageProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  // const { data, loading } = useGetActionsQuery({
  //   variables: {
  //     app_id: appId ?? "",
  //   },
  //   context: { headers: { team_id: teamId } },
  // });

  // const showList = data?.action && data?.action?.length > 0;
  return (
    <div className="py-8 gap-y-4 grid">
      <AppTopBar appId={appId} teamId={teamId} />
      <hr className="my-5 w-full text-grey-200 border-dashed" />
      <BasicInformation appId={appId} />
    </div>
  );
};
