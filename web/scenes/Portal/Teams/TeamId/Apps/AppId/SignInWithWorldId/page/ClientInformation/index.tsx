"use client";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { LockIcon } from "@/components/Icons/LockIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { CORE_APP_TEAM_ID } from "@/lib/constants";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import Error from "next/error";
import { useCallback, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { LinksForm } from "./Links";
import { Redirects } from "./Redirects";
import { useFetchSignInActionQuery } from "./graphql/client/fetch-sign-in-action.generated";
import { useResetClientSecretMutation } from "./graphql/client/reset-secret.generated";

export const ClientInformationPage = (props: {
  appID: string;
  teamID: string;
}) => {
  const { appID, teamID } = props;
  const [clientSecret, setClientSecret] = useState<string>("");
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamID ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamID]);

  const { data, loading: fetchingAction } = useFetchSignInActionQuery({
    variables: { app_id: appID },
  });

  const signInAction = data?.action[0];
  const isStaging = data?.app[0]?.is_staging;
  const createdAt = data?.app[0]?.created_at;

  // Check if app was created after September 29, 2025
  const isAppCreatedAfterCutoff = useMemo(() => {
    if (teamID === CORE_APP_TEAM_ID) return false;
    if (!createdAt) return false;
    const cutoffDate = new Date("2025-09-29T00:00:00Z");
    const appCreatedDate = new Date(createdAt);
    return appCreatedDate > cutoffDate;
  }, [createdAt, teamID]);

  const [resetClientSecretMutation] = useResetClientSecretMutation({
    variables: { app_id: appID, team_id: teamID },
  });

  const handleReset = useCallback(async () => {
    try {
      const result = await resetClientSecretMutation();

      if (result instanceof Error) {
        throw result;
      }

      setClientSecret(result.data?.reset_client_secret?.client_secret ?? "");
      toast.success("Client secret reset");
    } catch (error) {
      console.error("Reset Client Secret Error: ", error);
      toast.error("Failed to reset client secret");
    }
  }, [resetClientSecretMutation]);

  if (fetchingAction) {
    return (
      <div className="grid w-full gap-y-10 pb-10 pt-5">
        <Skeleton height={200} />
      </div>
    );
  }

  if (isAppCreatedAfterCutoff) {
    return (
      <div className="grid w-full gap-y-10 pb-10 pt-5">
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7}>Feature Not Available</Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Your app was created after Sign in with World ID was deprecated and
            is not eligible for this feature. Please read the announcement
            above.
          </Typography>
        </div>
      </div>
    );
  }

  if (!fetchingAction && !signInAction) {
    return <Error statusCode={404} title="Action not found" />;
  }

  return (
    <div className="grid w-full gap-y-10 pb-10 pt-5">
      <div className="grid gap-y-5">
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H7}>Client information</Typography>

          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Use these attributes to configure Sign in with World ID in your app
          </Typography>
        </div>

        <div className="grid w-full gap-y-2">
          <Input
            placeholder={appID}
            label="Client ID"
            disabled
            className="h-16"
            addOnRight={<CopyButton fieldName="Client ID" fieldValue={appID} />}
          />

          <Input
            placeholder={
              clientSecret == ""
                ? "Locked (reset to generate a new secret)"
                : clientSecret
            }
            label="Client secret"
            disabled
            className="h-16"
            helperText="Save the generated client secret. You won't be able to see it again."
            addOnLeft={
              clientSecret == "" ? (
                <LockIcon className="w-8 pl-1 text-grey-400" />
              ) : (
                <></>
              )
            }
            addOnRight={
              <div
                className={clsx(
                  "grid grid-cols-1fr/auto justify-items-end gap-x-3",
                  { hidden: !isEnoughPermissions },
                )}
              >
                <DecoratedButton
                  type="button"
                  variant="secondary"
                  className="h-9"
                  onClick={handleReset}
                >
                  Reset
                </DecoratedButton>

                {clientSecret !== "" && (
                  <CopyButton
                    fieldName="Client secret"
                    fieldValue={clientSecret}
                  />
                )}
              </div>
            }
          />
        </div>
      </div>

      <div className="grid gap-y-5">
        <div className="grid gap-y-3">
          <Typography as="h6" variant={TYPOGRAPHY.H7}>
            Redirects
          </Typography>

          <Typography as="p" variant={TYPOGRAPHY.R3} className="text-grey-500">
            You must specify at least one URL for authentication to work
          </Typography>
        </div>

        <Redirects
          actionId={signInAction?.id!}
          teamId={teamID}
          isStaging={isStaging ?? false}
          appId={appID}
          canEdit={isEnoughPermissions}
        />
      </div>

      <LinksForm
        signInAction={signInAction!}
        teamId={teamID}
        canEdit={isEnoughPermissions}
      />
    </div>
  );
};
