import {
  Dispatch,
  memo,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

import { IAppStore, useAppStore } from "@/stores/appStore";
import { Credential } from "./Credential";
import useSignInAction from "src/hooks/useSignInAction";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { useRouter } from "next/router";
import { Role_Enum } from "@/graphql/graphql";

const getStoreParams = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

export const Credentials = memo(function Credentials() {
  const { currentApp } = useAppStore(getStoreParams);
  const { clientSecret, resetClientSecret } = useSignInAction();
  const [appIdCopied, setAppIdCopied] = useState(false);
  const [clientSecretCopied, setClientSecretCopied] = useState(false);
  const { user } = useUser() as Auth0SessionUser;
  const router = useRouter();
  const team_id = router.query.team_id as string;

  const showClientSecretSection = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === team_id
    );
    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [team_id, user?.hasura.memberships]);

  const generateCopyButton = useCallback(
    (values: {
      copyValue: string;
      isCopied: boolean;
      setIsCopied: Dispatch<SetStateAction<boolean>>;
    }) => ({
      text: values.isCopied ? "Copied" : "Copy",
      action: async () => {
        values.setIsCopied(true);
        await navigator.clipboard.writeText(values.copyValue);
        setTimeout(() => values.setIsCopied(false), 2000);
      },
    }),
    []
  );

  return (
    <section className="grid gap-y-12">
      <div className="grid gap-y-2">
        <h3 className="font-medium">Client information</h3>
        <p className="text-neutral-secondary text-14 leading-none">
          Use these attributes to configure Sign in with World ID in your app.
        </p>
      </div>

      <div className="grid grid-flow-col justify-start gap-x-36">
        <Credential
          name="CLIENT ID"
          value={currentApp?.id ?? ""}
          buttons={[
            generateCopyButton({
              copyValue: currentApp?.id ?? "",
              isCopied: appIdCopied,
              setIsCopied: setAppIdCopied,
            }),
          ]}
        />

        {showClientSecretSection && (
          <Credential
            name="CLIENT SECRET"
            value={clientSecret ?? ""}
            buttons={[
              { text: "Reset", action: () => resetClientSecret() },
              ...(clientSecret
                ? [
                    generateCopyButton({
                      copyValue: clientSecret,
                      isCopied: clientSecretCopied,
                      setIsCopied: setClientSecretCopied,
                    }),
                  ]
                : []),
            ]}
          />
        )}
      </div>
    </section>
  );
});
