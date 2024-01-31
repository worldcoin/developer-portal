"use client";
import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useResetClientSecretMutation } from "./graphql/client/reset-secret.generated";
import { useCallback, useState } from "react";
import { Action } from "@/graphql/graphql";

export const ClientInformationPage = (props: {
  appID: string;
  action: Action;
}) => {
  const { appID } = props;
  const [clientSecret, setClientSecret] = useState<string>(""); // TODO: replace with actual client secret
  const [resetClientSecretMutation, { loading }] = useResetClientSecretMutation(
    { variables: { app_id: appID } }
  );

  // TODO: Requires Team ID
  const handleReset = useCallback(async () => {
    try {
      const result = await resetClientSecretMutation({
        variables: { app_id: appID },
      });

      if (result instanceof Error) {
        throw result;
      }
      console.log(result.data?.reset_client_secret);
      setClientSecret(result.data?.reset_client_secret?.client_secret ?? "");
    } catch (error) {
      console.error(error);
    }
  }, [appID, resetClientSecretMutation]);

  return (
    <div className="w-full gap-y-5 grid">
      <div className="gap-y-5 grid">
        <div className="">
          <Typography as="h6" variant={TYPOGRAPHY.M3}>
            Client information
          </Typography>
          <Typography as="p" variant={TYPOGRAPHY.R3} className="text-grey-500">
            Use these attributes to configure Sign in with World ID in your app
          </Typography>
        </div>
        <div className="grid gap-y-2 w-full">
          <Input
            placeholder={appID}
            label="Client ID"
            disabled
            addOnPosition="right"
            className="h-16"
            addOn={
              <Button type="button" className="pr-4">
                {/* // TODO: fix on rebase */}
                <WorldcoinIcon className="w-5 h-5 text-grey-900" />
              </Button>
            }
          />
          <Input
            placeholder={clientSecret == "" ? "Locked" : clientSecret}
            label="Client secret"
            disabled
            addOnPosition="right"
            className="h-16"
            addOn={
              <DecoratedButton
                type="button"
                variant="secondary"
                onClick={handleReset}
              >
                Reset
              </DecoratedButton>
            }
          />
        </div>
      </div>
      <div>
        <div className="grid gap-y-5">
          <div>
            <Typography as="h6" variant={TYPOGRAPHY.M3}>
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
          <Input
            placeholder="https://"
            label="Client secret"
            className="h-16"
          />
          <DecoratedButton
            type="submit"
            variant="secondary"
            className="w-36 text-sm h-12"
          >
            Add another
          </DecoratedButton>
        </div>
      </div>

      <div className="">
        <Typography as="h6" variant={TYPOGRAPHY.M3}>
          Privacy policy
        </Typography>
        <Typography as="p" variant={TYPOGRAPHY.R3} className="text-grey-500">
          Link to the webpage where your privacy policy is posted{" "}
        </Typography>
      </div>
      <Input placeholder="https://" label="Client secret" className="h-16" />
      <DecoratedButton type="submit" className="w-36 text-sm h-12">
        Add another
      </DecoratedButton>
    </div>
  );
};
