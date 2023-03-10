import { memo, useCallback, useEffect, useMemo } from "react";
import { IAppStore, useAppStore } from "@/stores/appStore";
import { Credential } from "./Credential";
import useSignInAction from "src/hooks/useSignInAction";

const getStoreParams = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

const copy = async (value: string) =>
  await navigator.clipboard.writeText(value);

export const Credentials = memo(function Credentials() {
  const { currentApp } = useAppStore(getStoreParams);
  const { clientSecret, resetClientSecret } = useSignInAction();

  const generateCopyButton = useCallback(
    (values: { text: string; copyValue: string }) => ({
      text: values.text,
      action: () => copy(values.copyValue),
    }),
    []
  );

  const clientSecretButtons = useMemo(
    () => [
      { text: "Reset", action: () => resetClientSecret() },
      ...(clientSecret
        ? [{ text: "Copy", action: () => copy(clientSecret) }]
        : []),
    ],
    [clientSecret, resetClientSecret]
  );

  return (
    <section className="grid gap-y-4">
      <h3 className="font-medium">Client information</h3>

      <div className="grid grid-flow-col justify-start gap-x-36">
        <Credential
          name="CLIENT ID"
          value={currentApp?.id ?? ""}
          buttons={[
            generateCopyButton({
              text: "Copy",
              copyValue: currentApp?.id ?? "",
            }),
          ]}
        />

        <Credential
          name="CLIENT SECRET"
          value={clientSecret ?? ""}
          buttons={clientSecretButtons}
        />
      </div>
    </section>
  );
});
