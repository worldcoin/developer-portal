import { memo, useCallback, useEffect, useMemo } from "react";
import { IAppStore, useAppStore } from "@/stores/appStore";
import { shallow } from "zustand/shallow";
import { useSignInActionStore } from "../store";
import { Credential } from "./Credential";
import { useRouter } from "next/router";

const getStoreParams = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

export const Credentials = memo(function Credentials() {
  const router = useRouter();
  const { currentApp } = useAppStore(getStoreParams);

  const {
    signInAction,
    clientSecretSeenOnce,
    setClientSecretSeenOnce,
    generateNewClientSecret,
  } = useSignInActionStore((state) => ({ ...state }), shallow);

  const generateCopyButton = useCallback(
    (values: { text: string; copyValue: string }) => ({
      text: values.text,
      action: () => navigator.clipboard.writeText(values.copyValue),
    }),
    []
  );

  useEffect(() => {
    router.events.on("routeChangeStart", () => setClientSecretSeenOnce(true));

    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE: we need to this runs only on navigate to another page
  }, []);

  const clientSecretButtons = useMemo(() => {
    const resetButton = {
      text: "Reset Secret",
      action: () => {
        //TODO: Reset secret logic here
        generateNewClientSecret();
      },
    };

    const copyButton = generateCopyButton({
      text: "Copy",
      copyValue: signInAction?.client_secret ?? "",
    });

    if (!clientSecretSeenOnce) {
      return [resetButton, copyButton];
    }

    return [resetButton];
  }, [
    clientSecretSeenOnce,
    generateCopyButton,
    generateNewClientSecret,
    signInAction?.client_secret,
  ]);

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
          value={signInAction?.client_secret ?? ""}
          valueHidden={clientSecretSeenOnce}
          buttons={clientSecretButtons}
        />
      </div>
    </section>
  );
});
