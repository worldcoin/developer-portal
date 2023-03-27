import { Dispatch, memo, SetStateAction, useCallback, useState } from "react";
import { IAppStore, useAppStore } from "@/stores/appStore";
import { Credential } from "./Credential";
import useSignInAction from "src/hooks/useSignInAction";

const getStoreParams = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

export const Credentials = memo(function Credentials() {
  const { currentApp } = useAppStore(getStoreParams);
  const { clientSecret, resetClientSecret } = useSignInAction();
  const [appIdCopied, setAppIdCopied] = useState(false);
  const [clientSecretCopied, setClientSecretCopied] = useState(false);

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
          Use these attributes to configure Sign in with Worldcoin in your app.
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
      </div>
    </section>
  );
});
