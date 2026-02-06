"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { ErrorPage } from "@/components/ErrorPage";
import Skeleton from "react-loading-skeleton";
import { ActionsHeader } from "@/components/ActionsHeader";
import { TryAction } from "../TryAction";
import { UpdateActionForm } from "../UpdateAction";
import { useGetSingleActionQuery } from "./graphql/client/get-single-action.generated";
import { urls } from "@/lib/urls";

type ActionIdSettingsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
  isReadOnly?: boolean;
};

export const ActionIdSettingsPage = ({
  params,
  isReadOnly,
}: ActionIdSettingsPageProps) => {
  const actionID = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const { data, loading } = useGetSingleActionQuery({
    variables: {
      action_id: actionID ?? "",
    },
  });

  const action = data?.action[0];

  if (!loading && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  } else {
    return (
      <>
        <SizingWrapper gridClassName="order-1 pt-6 md:pt-10">
          <ActionsHeader
            displayText={action?.name ?? ""}
            backText={
              isReadOnly
                ? "Back to Legacy Actions"
                : "Back to Incognito Actions"
            }
            backUrl={urls.actions({ team_id: teamId ?? "", app_id: appId })}
            isLoading={loading}
            analyticsContext={{
              teamId,
              appId,
              actionId: actionID,
              location: "actions",
            }}
          />

          <hr className="mt-5 w-full border-dashed text-grey-200" />
        </SizingWrapper>

        <SizingWrapper gridClassName="order-2 pt-2 pb-6 md:pb-10">
          <div className="grid w-full grid-cols-1 items-start justify-between gap-x-32 gap-y-10 md:grid-cols-1fr/auto">
            {loading ? (
              <Skeleton count={4} />
            ) : (
              // Only possible if action is defined
              <UpdateActionForm
                action={action!}
                teamId={teamId ?? ""}
                isReadOnly={isReadOnly}
              />
            )}

            {loading ? (
              <Skeleton className="md:w-[480px]" height={400} />
            ) : (
              <TryAction action={action!} />
            )}
          </div>
        </SizingWrapper>
      </>
    );
  }
};
