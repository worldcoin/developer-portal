import { memo, useCallback, useState } from "react";
import { text } from "src/common/styles";
import { Button } from "src/common/LegacyButton";
import cn from "classnames";
import { ApiVerificationInstructions } from "../Instructions/ApiVerification";
import { JwtVerificationInstructions } from "../Instructions/JwtVerification";
import { useValues } from "kea";
import { actionLogic } from "src/logics/actionLogic";

type Method = "api" | "jwt";

export const HostedPageInstructions = memo(function Instructions(props: {
  actionId: string;
}) {
  const { actionUrls } = useValues(actionLogic);
  const [method, setMethod] = useState<Method>("jwt");
  const createSetMethodHandler = useCallback(
    (method: Method) => () => setMethod(method),
    []
  );

  return (
    <>
      <div className="grid grid-cols-1fr/auto items-center -mt-4.5 mb-4">
        <h3 className={text.h3}>Choose a verification method</h3>

        <div className="h-14 grid grid-flow-col items-stretch gap-1 p-1.5 border border-neutral-muted rounded-xl">
          <Button
            className={cn(
              { "border-opacity-0 opacity-30": method !== "api" },
              { "cursor-default hover:opacity-100": method === "api" }
            )}
            variant={method === "api" ? "contained" : "outlined"}
            color="primary"
            size="md"
            onClick={createSetMethodHandler("api")}
          >
            API verification
          </Button>
          <Button
            className={cn(
              { "border-opacity-0 opacity-30": method !== "jwt" },
              { "cursor-default hover:opacity-100": method === "jwt" }
            )}
            variant={method === "jwt" ? "contained" : "outlined"}
            color="primary"
            size="md"
            onClick={createSetMethodHandler("jwt")}
          >
            JWT verification
          </Button>
        </div>
      </div>

      <div className="p-8 bg-ffffff border border-neutral-muted rounded-xl">
        {method === "api" && (
          <ApiVerificationInstructions actionId={props.actionId} />
        )}
        {method === "jwt" && (
          <JwtVerificationInstructions
            actionId={props.actionId}
            hostedPageUrl={actionUrls?.hostedPage || ""}
          />
        )}
      </div>
    </>
  );

  return (
    <div className="grid gap-y-6 text-16 leading-7">
      <div className="grid grid-cols-1fr/auto items-center -mt-4.5 mb-4">
        <h3 className={text.h3}>Choose a verification method</h3>

        <div className="h-14 grid grid-flow-col items-stretch gap-1 p-1.5 border border-neutral-muted rounded-xl">
          <Button
            className={cn(
              { "border-opacity-0 opacity-30": method !== "api" },
              { "cursor-default hover:opacity-100": method === "api" }
            )}
            variant={method === "api" ? "contained" : "outlined"}
            color="primary"
            size="md"
            onClick={createSetMethodHandler("api")}
          >
            API verification
          </Button>
          <Button
            className={cn(
              { "border-opacity-0 opacity-30": method !== "jwt" },
              { "cursor-default hover:opacity-100": method === "jwt" }
            )}
            variant={method === "jwt" ? "contained" : "outlined"}
            color="primary"
            size="md"
            onClick={createSetMethodHandler("jwt")}
          >
            JWT verification
          </Button>
        </div>
      </div>
    </div>
  );
});
