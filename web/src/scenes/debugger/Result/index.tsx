import cn from "classnames";
import { useCallback, useEffect, useState } from "react";
import { Button } from "src/components/Button";
import { Icon, IconType } from "src/components/Icon";

interface ResultProps {
  classNames?: string;
  appId: string;
  action: string;
  isStaging: boolean;
  response: string;
  signal: string;
  hasTried: boolean;
}

enum Status {
  SUCCESS,
  WARN,
  ERROR,
}

const messages = {
  SUCCESS_ONCHAIN: (
    <>
      Your <b>Proof</b> is <b>valid</b> and <b>verifiable</b>!
    </>
  ),
  SUCCESS_PENDING: (
    <>
      Your <b>Proof</b> is <b>valid</b> and is <b>pending</b> inclusion
    </>
  ),

  INVALID_JSON: (
    <>
      Seems like your <b>Verification Response</b> is not a valid <b>JSON</b>{" "}
      string
    </>
  ),

  MISSING_ATTR: (attr: string) => (
    <>
      Your <b>Verification Response</b> is invalid, missing required{" "}
      <b>{attr}</b> attribute
    </>
  ),

  NOT_VERIFIED: (
    <>
      Your <b>Proof</b> is invalid
    </>
  ),

  REQUEST_ERROR: <>Something went wrong</>,
} as const;

export function Result(props: ResultProps) {
  const [status, setStatus] = useState<Status>();
  const [message, setMessage] = useState<JSX.Element | string>();
  const [response, setResponse] = useState<object>();

  useEffect(() => {
    try {
      setResponse(JSON.parse(props.response));
    } catch {
      if (props.hasTried) {
        setStatus(Status.ERROR);
        setMessage(messages.INVALID_JSON);
      }
    }
  }, [props.hasTried, props.response]);

  const handleVerify = useCallback(async () => {
    if (!response) {
      return;
    }

    try {
      const userInput = JSON.parse(props.response);

      const res = await fetch("/api/v1/debugger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userInput,
          action: props.action,
          app_id: props.appId,
          is_staging: props.isStaging,
          signal: props.signal,
        }),
      });

      const data = await res.json();

      // NOTE: missing attr in response
      if (data.code === "required") {
        setStatus(Status.ERROR);
        setMessage(messages.MISSING_ATTR(data.attribute));
        return;
      }

      // NOTE: other errors
      if (res.status !== 200) {
        setStatus(Status.ERROR);
        setMessage(messages.NOT_VERIFIED);
        return;
      }

      // NOTE: success mined
      setStatus(Status.SUCCESS);
      if (data.status === "on-chain") {
        setMessage(messages.SUCCESS_ONCHAIN);
      } else {
        setMessage(messages.SUCCESS_PENDING);
      }
    } catch (err) {
      setStatus(Status.ERROR);
      setMessage(messages.REQUEST_ERROR);
    }
  }, [
    props.action,
    props.appId,
    props.isStaging,
    props.response,
    props.signal,
    response,
  ]);

  return (
    <div className={cn("pr-10", props.classNames)}>
      <div className="rounded-xl p-6 border border-f0edf9 space-y-6">
        <div className="space-y-4">
          <h4 className="font-sora font-semibold">Debugging results</h4>

          {status !== undefined && message && (
            <div
              className={cn("flex items-start gap-4 p-6", {
                "bg-success-light": status === Status.SUCCESS,
                "bg-warning-light": status === Status.WARN,
                "bg-danger-light": status === Status.ERROR,
              })}
            >
              <Icon
                name={
                  ["check", "warning-triangle", "close"][status] as IconType
                }
                className={cn("flex-none w-4.5 h-4.5", {
                  "text-success": status === Status.SUCCESS,
                  "text-warning": status === Status.WARN,
                  "text-danger": status === Status.ERROR,
                })}
              />

              <div className="space-y-1.5">
                <p
                  className={cn("text-14 font-bold font-sora", {
                    "text-success": status === Status.SUCCESS,
                    "text-warning": status === Status.WARN,
                    "text-danger": status === Status.ERROR,
                  })}
                >
                  {["Success", "Warning", "Error"][status]}
                </p>

                <div className="text-12 leading-4.5 text-657080 font-mono">
                  {message}
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          className="w-full p-4"
          onClick={handleVerify}
          disabled={!response}
        >
          Validate Proof
        </Button>
      </div>
    </div>
  );
}
