"use client";
import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useResetClientSecretMutation } from "./graphql/client/reset-secret.generated";
import { useCallback, useState } from "react";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { toast } from "react-toastify";
import { LockIcon } from "@/components/Icons/LockIcon";
import clsx from "clsx";
import { Redirects } from "./Redirects";
import { useFetchSignInActionQuery } from "./graphql/client/fetch-sign-in-action.generated";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useUpdateSignInActionMutation } from "./graphql/client/update-sign-in-action.generated";

const schema = yup.object({
  privacy_policy_uri: yup.string().url("Must be a valid URL").optional(),
  terms_uri: yup.string().url("Must be a valid URL").optional(),
});

type ClientInformation = yup.InferType<typeof schema>;

export const ClientInformationPage = (props: {
  appID: string;
  teamID: string;
  action: {
    id: string;
    app_id: string;
    status: string;
    privacy_policy_uri?: string | null | undefined;
    terms_uri?: string | null | undefined;
  };
}) => {
  const { appID, teamID, action } = props;
  const [clientSecret, setClientSecret] = useState<string>("");

  const { data, loading: fetchingAction } = useFetchSignInActionQuery({
    variables: { app_id: appID },
  });

  const [resetClientSecretMutation] = useResetClientSecretMutation({
    variables: { app_id: appID },
  });

  const [updateSignInActionMutation] = useUpdateSignInActionMutation({
    context: { headers: { team_id: teamID } },
  });

  // TODO: Requires Team ID and User ID
  const handleReset = useCallback(async () => {
    try {
      const result = await resetClientSecretMutation({
        variables: { app_id: appID },
        context: { headers: { team_id: teamID } },
      });

      if (result instanceof Error) {
        throw result;
      }
      setClientSecret(result.data?.reset_client_secret?.client_secret ?? "");
    } catch (error) {
      console.error(error);
    }
  }, [appID, resetClientSecretMutation]);

  const copyToClipboard = (fieldName: string, fieldValue: string) => {
    navigator.clipboard.writeText(fieldValue);
    toast.success(`${fieldName} copied to clipboard`);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientInformation>({
    resolver: yupResolver(schema),
    shouldFocusError: false,
    defaultValues: {
      privacy_policy_uri: action.privacy_policy_uri ?? "",
      terms_uri: action.terms_uri ?? "",
    },
  });

  const submit = useCallback(async (data: ClientInformation) => {
    try {
      await updateSignInActionMutation({
        variables: {
          id: action.id,
          input: {
            privacy_policy_uri: data.privacy_policy_uri,
            terms_uri: data.terms_uri,
          },
        },
      });
      toast.success("Links saved!");
    } catch (error) {
      console.error(error);
      toast.error("Error updating action");
    }
  }, []);

  const signinAction = data?.action;
  if (fetchingAction) {
    return <div></div>;
  } else if (!signinAction || signinAction.length === 0) {
    return <Typography variant={TYPOGRAPHY.M3}>Action found</Typography>;
  }
  return (
    <div className="w-full gap-y-10 grid pt-5 pb-10">
      <div className="gap-y-5 grid">
        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.M2}>Client information</Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Use these attributes to configure Sign in with World ID in your app
          </Typography>
        </div>
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
            addOnLeft={
              clientSecret == "" ? (
                <LockIcon className=" text-grey-400" />
              ) : (
                <></>
              )
            }
            addOnRight={
              <div
                className={clsx(
                  "grid grid-cols-1fr/auto justify-items-end gap-x-3",
                  { "pr-4": clientSecret !== "" },
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
                      copyToClipboard("client secret", clientSecret)
                    }
                  >
                    <CopyIcon className="w-5 h-5 text-grey-900 border" />
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </div>
      <div className="grid gap-y-5">
        <div className="grid gap-y-3">
          <Typography as="h6" variant={TYPOGRAPHY.M2}>
            Redirects
          </Typography>
          <Typography as="p" variant={TYPOGRAPHY.R3} className="text-grey-500">
            You must specify at least one URL for authentication to work
          </Typography>
        </div>
        <Redirects actionID={signinAction[0].id} />
      </div>

      <form className="grid gap-y-5" onSubmit={handleSubmit(submit)}>
        <div className="grid gap-y-3">
          <Typography as="h6" variant={TYPOGRAPHY.M2}>
            Legal links
          </Typography>
          <Typography as="p" variant={TYPOGRAPHY.R3} className="text-grey-500">
            Links to where your Privacy Policy and Terms of Use are posted
          </Typography>
        </div>
        <Input
          register={register("privacy_policy_uri")}
          placeholder="https://"
          label="Privacy Policy"
          className="h-16"
          errors={errors?.privacy_policy_uri}
        />
        <Input
          register={register("terms_uri")}
          placeholder="https://"
          label="Terms of Use"
          className="h-16"
          errors={errors?.terms_uri}
        />

        <DecoratedButton type="submit" className="w-fit text-sm h-12">
          <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
        </DecoratedButton>
      </form>
    </div>
  );
};
