import { memo, useCallback, useEffect, useMemo } from "react";
import { useAppsStore } from "stores/app-store";
import { shallow } from "zustand/shallow";
import { useSignInActionStore } from "../store";
import { Credential } from "./Credential";

export const Credentials = memo(function Credentials() {
  const currentApp = useAppsStore((state) => state.currentApp);
  const { signInAction, clientSecretSeenOnce, setClientSecretSeenOnce } =
    useSignInActionStore((state) => ({ ...state }), shallow);

  const generateCopyButton = useCallback(
    (values: { text: string; copyValue: string }) => ({
      text: values.text,
      action: () => navigator.clipboard.writeText(values.copyValue),
    }),
    []
  );

  useEffect(() => {
    return () => {
      setClientSecretSeenOnce(true);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE: we need to this runs only on unmount
  }, []);

  const clientSecretButtons = useMemo(() => {
    const resetButton = {
      text: "Reset Secret",
      action: () => {
        //TODO: Reset secret logic here
        setClientSecretSeenOnce(false);
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
    setClientSecretSeenOnce,
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
