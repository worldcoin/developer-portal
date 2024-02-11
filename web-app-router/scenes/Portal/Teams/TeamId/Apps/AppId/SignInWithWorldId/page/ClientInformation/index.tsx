"use client";
import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useResetClientSecretMutation } from "./graphql/client/reset-secret.generated";
import { useCallback, useMemo, useState } from "react";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { toast } from "react-toastify";
import { LockIcon } from "@/components/Icons/LockIcon";
import clsx from "clsx";
import { Redirects } from "./Redirects";
import { useFetchSignInActionQuery } from "./graphql/client/fetch-sign-in-action.generated";
import Error from "next/error";
import { LinksForm } from "./Links";
import Skeleton from "react-loading-skeleton";
import { Auth0SessionUser } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { checkUserPermissions } from "@/lib/utils";
import { Role_Enum } from "@/graphql/graphql";

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
    context: { headers: { team_id: teamID } },
  });
  const signInAction = data?.action[0];

  const [resetClientSecretMutation] = useResetClientSecretMutation({
    variables: { app_id: appID },
    context: { headers: { team_id: teamID } },
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
      console.error(error);
      toast.error("Failed to reset client secret");
    }
  }, [resetClientSecretMutation]);

  const copyToClipboard = (fieldName: string, fieldValue: string) => {
    navigator.clipboard.writeText(fieldValue);
    toast.success(`${fieldName} copied to clipboard`);
  };

  if (!fetchingAction && !signInAction) {
    return <Error statusCode={404} title="Action not found" />;
  } else {
    return (
      <div className="w-full gap-y-10 grid pt-5 pb-10">
        <div className="gap-y-5 grid">
          <div className="grid gap-y-3">
            <Typography variant={TYPOGRAPHY.H7}>Client information</Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Use these attributes to configure Sign in with World ID in your
              app
            </Typography>
          </div>
          {fetchingAction ? (
            <Skeleton count={2} />
          ) : (
            <div className="grid gap-y-2 w-full">
              <Input
                placeholder={appID}
                label="Client ID"
                disabled
                className="h-16"
                addOnRight={
                  <Button
                    type="button"
                    className="pr-4"
                    onClick={() => copyToClipboard("Client ID", appID)}
                  >
                    <CopyIcon className="w-5 h-5 text-grey-900" />
                  </Button>
                }
              />
              <Input
                placeholder={clientSecret == "" ? "Locked" : clientSecret}
                label="Client secret"
                disabled
                className="h-16"
                helperText="Save the generated client secret. You won't be able to see it again."
                addOnLeft={
                  clientSecret == "" ? (
                    <LockIcon className="pl-1 w-8 text-grey-400" />
                  ) : (
                    <></>
                  )
                }
                addOnRight={
                  <div
                    className={clsx(
                      "grid grid-cols-1fr/auto justify-items-end gap-x-3",
                      { hidden: !isEnoughPermissions },
                      { "pr-4": clientSecret !== "" }
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
                      <Button
                        type="button"
                        className=""
                        onClick={() =>
                          copyToClipboard("Client secret", clientSecret)
                        }
                      >
                        <CopyIcon className="w-5 h-5 text-grey-900" />
                      </Button>
                    )}
                  </div>
                }
              />
            </div>
          )}
        </div>
        <div className="grid gap-y-5">
          <div className="grid gap-y-3">
            <Typography as="h6" variant={TYPOGRAPHY.H7}>
              Redirects
            </Typography>
            <Typography
              as="p"
              variant={TYPOGRAPHY.R3}
              className="text-grey-500"
            >
              You must specify at least one URL for authentication to work
            </Typography>
          </div>
          {fetchingAction ? (
            <Skeleton count={2} />
          ) : (
            <Redirects
              actionId={signInAction?.id!}
              teamId={teamID}
              appId={appID}
              canEdit={isEnoughPermissions}
            />
          )}
        </div>
        {fetchingAction ? (
          <Skeleton height={150} />
        ) : (
          <LinksForm
            signInAction={signInAction!}
            teamId={teamID}
            canEdit={isEnoughPermissions}
          />
        )}
      </div>
    );
  }
};
