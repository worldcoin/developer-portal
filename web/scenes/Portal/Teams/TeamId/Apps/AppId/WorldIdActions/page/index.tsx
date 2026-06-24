"use client";

import { UserStoryIcon } from "@/components/Icons/UserStoryIcon";
import { RestrictedButton } from "@/components/RestrictedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useTeamPermission } from "@/lib/team-permissions/use-team-permission";
import { useEffect, useRef, useState } from "react";
import { ActionsListV4 } from "./ActionsListV4";
import { CreateActionDialogV4 } from "./CreateActionDialogV4";
import { useGetActionsV4Query } from "./graphql/client/get-actions-v4.generated";

type WorldIdActionsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams?: Record<string, string> | null | undefined;
};

export const WorldIdActionsPage = ({
  params,
  searchParams,
}: WorldIdActionsPageProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId ?? "";
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasAutoOpenedCreateAction = useRef(false);
  const createPermission = useTeamPermission(teamId, "create_world_id_action");
  const shouldAutoOpenCreateAction = searchParams?.createAction === "true";

  const { data, loading, error, refetch } = useGetActionsV4Query({
    variables: {
      app_id: appId ?? "",
    },
    skip: !appId,
  });

  const actions = data?.action_v4 || [];

  useEffect(() => {
    if (
      shouldAutoOpenCreateAction &&
      createPermission.allowed &&
      !hasAutoOpenedCreateAction.current
    ) {
      setDialogOpen(true);
      hasAutoOpenedCreateAction.current = true;
    }
  }, [createPermission.allowed, shouldAutoOpenCreateAction]);

  const handleDialogClose = async (success?: boolean) => {
    setDialogOpen(false);
    if (success) {
      await refetch();
    }
  };

  if (loading) {
    return (
      <SizingWrapper className="flex items-center justify-center py-10">
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          Loading...
        </Typography>
      </SizingWrapper>
    );
  }

  if (error) {
    return (
      <SizingWrapper className="flex items-center justify-center py-10">
        <div className="flex flex-col items-center gap-2">
          <Typography variant={TYPOGRAPHY.R3} className="text-system-error-500">
            Error loading actions
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            {error.message}
          </Typography>
        </div>
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper gridClassName="grow" className="flex flex-col">
      {actions.length === 0 ? (
        <div className="grid size-full items-start justify-items-center overflow-hidden pt-20">
          <div className="flex flex-col items-center justify-center gap-6 py-20">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#9D50FF]">
              <UserStoryIcon className="size-8 text-white" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Typography variant={TYPOGRAPHY.H6}>
                Create your first action
              </Typography>
              <Typography
                variant={TYPOGRAPHY.R4}
                className="max-w-md text-center text-grey-500"
              >
                Actions are used to request uniqueness proofs
              </Typography>
            </div>
            <RestrictedButton
              restriction={createPermission}
              variant="primary"
              type="button"
              onClick={() => setDialogOpen(true)}
              testId="create-action-v4-empty"
              aria-label="Create your first action"
            >
              <Typography variant={TYPOGRAPHY.M4}>Create</Typography>
            </RestrictedButton>
          </div>
        </div>
      ) : (
        <ActionsListV4
          actions={actions}
          onCreateClick={() => setDialogOpen(true)}
          teamId={teamId}
          appId={appId}
          createPermission={createPermission}
        />
      )}

      {dialogOpen && (
        <CreateActionDialogV4 open={dialogOpen} onClose={handleDialogClose} />
      )}
    </SizingWrapper>
  );
};
