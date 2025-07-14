"use client";
import { Button } from "@/components/Button";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { OutgoingLinkIcon } from "@/components/Icons/OutgoingLink";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import JSON5 from "json5";
import posthog from "posthog-js";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const testProofSchema = yup
  .object({
    signal: yup.string().optional(),
    verification_response: yup.string().required("This field is required"),
  })
  .noUnknown();

type TestProofFormValues = yup.Asserts<typeof testProofSchema>;

const exampleVR = `{
  "nullifier_hash": "0x26a12376e45f7b93fba3d5ddd7f1092eb...",
  "proof": "0x0751916cb52efab89f7045f5174638d072ea60d9e9...",
  "merkle_root": "0x0f6ee51b93a1261af6c4302c30afbbdf8af5...",
  "verification_level": "orb"
}`;

const messages = {
  IDLE: <>No verification response</>,
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
      Your <b>verification Response</b> is not a valid <b>JSON</b> string
    </>
  ),

  MISSING_ATTR: (attr: string) => (
    <>
      Invalid <b>verification response</b>:<br></br>
      <b>{attr}</b> must be specified
    </>
  ),

  NOT_VERIFIED: (
    <>
      Your <b>Proof</b> is invalid
    </>
  ),

  REQUEST_ERROR: <>Something went wrong</>,
} as const;

enum Status {
  SUCCESS,
  ERROR,
  IDLE,
}
type Action = {
  id: string;
  app_id: string;
  name: string;
  action: string;
  app: {
    is_staging: boolean;
  };
};
type DebuggerProps = {
  action: Action;
  appID: string;
};

export const Debugger = (props: DebuggerProps) => {
  const { action, appID } = props;
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [message, setMessage] = useState<JSX.Element | string>(messages.IDLE);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty, isValid },
  } = useForm<TestProofFormValues>({
    resolver: yupResolver(testProofSchema),
    mode: "onChange",
  });

  const signal = watch("signal");
  const verificationResponse = watch("verification_response");

  useEffect(() => {
    if (isDirty) {
      setStatus(Status.IDLE);
      setMessage(messages.IDLE);
    }
  }, [signal, verificationResponse, isDirty]);

  const submit = async (formData: TestProofFormValues) => {
    try {
      setStatus(Status.IDLE);
      const verification = JSON5.parse(formData.verification_response ?? "");
      const res = await fetch("/api/v1/debugger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...verification,
          app_id: appID,
          action: action?.action,
          signal: formData.signal,
          is_staging: action.app?.is_staging,
        }),
      });

      const response = await res.json();
      // NOTE: missing attr in response
      if (response.code === "invalid") {
        setStatus(Status.ERROR);
        setMessage(messages.MISSING_ATTR(response.attribute));
        return;
      }

      // NOTE: other errors
      if (res.status !== 200) {
        setStatus(Status.ERROR);
        setMessage(messages.NOT_VERIFIED);
        posthog.capture("debugger-verify-failed", {
          app_id: appID,
          action_id: action.id,
          environment: action.app?.is_staging ? "staging" : "production",
        });
        return;
      }

      // NOTE: success mined
      setStatus(Status.SUCCESS);
      if (response.status === "on-chain") {
        setMessage(messages.SUCCESS_ONCHAIN);
        posthog.capture("debugger-verify-success", {
          app_id: appID,
          action_id: action.id,
          environment: action.app?.is_staging ? "staging" : "production",
          engine: "on-chain",
        });
      } else {
        setMessage(messages.SUCCESS_PENDING);
        posthog.capture("debugger-verify-success", {
          app_id: appID,
          action_id: action.id,
          environment: action.app?.is_staging ? "staging" : "production",
          engine: "cloud",
        });
      }
    } catch (err) {
      setStatus(Status.ERROR);
      setMessage(messages.REQUEST_ERROR);
    }
  };

  const formatCode = useCallback(
    async (data: TestProofFormValues) => {
      try {
        const json = JSON5.parse(data.verification_response ?? "");
        setValue("verification_response", JSON5.stringify(json, null, 2));
      } catch (e) {
        setError("verification_response", {
          type: "manual",
          message: "Unable to auto format the response",
        });
      }
    },
    [setValue, setError],
  );
  return (
    <form
      className="grid w-full grid-cols-1 items-start justify-between gap-x-32 gap-y-10 sm:grid-cols-1fr/auto"
      onSubmit={handleSubmit(submit)}
    >
      <div className="grid w-full gap-y-6">
        <Typography variant={TYPOGRAPHY.H7}>Output parameters</Typography>
        <div className="grid gap-y-8">
          <Input
            register={register("signal")}
            helperText="Enter the signal as passed to IDKit"
            label="Signal"
            placeholder="my_signal"
          />
          <TextArea
            register={register("verification_response")}
            helperText="These are the parameters you get from IdKit"
            label="Verification response"
            rows={8}
            required
            errors={errors?.verification_response}
            placeholder={exampleVR}
            className="py-1"
          />
          <DecoratedButton
            type="button"
            className="w-fit py-3"
            onClick={() => handleSubmit(formatCode)()}
          >
            <Typography variant={TYPOGRAPHY.M3}>Format Response</Typography>
          </DecoratedButton>
        </div>
      </div>
      <div className="grid w-full gap-y-6 lg:w-[480px]">
        <Typography variant={TYPOGRAPHY.H7}>Results</Typography>
        <div
          className={clsx(
            "flex h-80 w-full flex-col items-center justify-center rounded-lg border border-grey-100 bg-grey-50",
            {
              "border-0 bg-system-success-50": status === Status.SUCCESS,
              "border-0 bg-system-error-50": status === Status.ERROR,
            },
          )}
        >
          <CircleIconContainer
            variant={
              status === Status.IDLE
                ? "muted"
                : status === Status.SUCCESS
                  ? "success"
                  : "error"
            }
          >
            {status === Status.IDLE && <WorldcoinIcon />}
            {status === Status.SUCCESS && <CheckIcon size="28" />}
            {status === Status.ERROR && <CloseIcon className="size-5" />}
          </CircleIconContainer>
          <div className="mt-8 flex flex-col items-center gap-y-5 px-12 text-center">
            <Typography
              variant={TYPOGRAPHY.R4}
              className={clsx("text-sm text-grey-400", {
                "text-system-error-600": status === Status.ERROR,
                "text-system-success-600": status === Status.SUCCESS,
              })}
            >
              {message}
            </Typography>
            <div className="grid gap-y-2">
              <DecoratedButton
                type="submit"
                variant="secondary"
                className="text-grey-700 disabled:text-grey-300 md:w-60"
                disabled={!isDirty || !isValid}
              >
                <Typography variant={TYPOGRAPHY.M3}>Validate Proof</Typography>
              </DecoratedButton>
              {action.app?.is_staging && (
                <Button
                  href="https://simulator.worldcoin.org/"
                  className="flex w-full items-center justify-center gap-x-1"
                >
                  <Typography variant={TYPOGRAPHY.R5} className="text-blue-500">
                    Open Simulator
                  </Typography>
                  <OutgoingLinkIcon className="size-3 text-blue-500" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
