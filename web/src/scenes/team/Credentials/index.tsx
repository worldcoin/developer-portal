import { Dispatch, memo, SetStateAction, useCallback, useState } from "react";
import { Credential } from "./Credential";
import { useTeam } from "../hooks/useTeam";
import useKeys from "src/hooks/useKeys";

export const Credentials = memo(function Credentials() {
  const { data: team } = useTeam();
  const { currentSecret, resetAPIKey } = useKeys();
  const [teamIdCopied, setTeamIdCopied] = useState(false);
  const [apiKeyCopied, setAPIKeyCopied] = useState(false);

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
        <h3 className="font-medium">Developer API Key</h3>
        <p className="text-neutral-secondary text-14 leading-none">
          Use these attributes to authenticate to the Developer Portal API. API
          keys are team-specific.
        </p>
      </div>

      <div className="grid grid-flow-col justify-start gap-x-36">
        <Credential
          name="TEAM ID"
          value={team?.id ?? ""}
          buttons={[
            generateCopyButton({
              copyValue: team?.id ?? "",
              isCopied: teamIdCopied,
              setIsCopied: setTeamIdCopied,
            }),
          ]}
        />

        <Credential
          name="API KEY"
          value={currentSecret ?? ""}
          buttons={[
            { text: "Reset", action: () => resetAPIKey() },
            ...(currentSecret
              ? [
                  generateCopyButton({
                    copyValue: currentSecret,
                    isCopied: apiKeyCopied,
                    setIsCopied: setAPIKeyCopied,
                  }),
                ]
              : []),
          ]}
        />
      </div>
    </section>
  );
});
