"use client";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { TextArea } from "@/components/TextArea";
import { useCallback, useEffect, useState } from "react";
import JSON5 from "json5";
import clsx from "clsx";
import { Input } from "@/components/Input";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { CloseIcon } from "@/components/Icons/CloseIcon";

const testProofSchema = yup.object({
  signal: yup.string().optional(),
  verification_response: yup.string().required("This field is required"),
});

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
      Your <b>Verification Response</b> is not a valid <b>JSON</b> string
    </>
  ),

  MISSING_ATTR: (attr: string) => (
    <>
      Invalid <b>Verification Response</b>, missing required <b>{attr}</b>{" "}
      attribute
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
        // posthog.capture("debugger-verify-failed");
        return;
      }

      // NOTE: success mined
      setStatus(Status.SUCCESS);
      if (response.status === "on-chain") {
        setMessage(messages.SUCCESS_ONCHAIN);
        // posthog.capture("debugger-verify-success", { environment: "on-chain" });
      } else {
        setMessage(messages.SUCCESS_PENDING);
        // posthog.capture("debugger-verify-success", { environment: "cloud" });
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
    [setValue, setError]
  );
  return (
    <form
      className="w-full grid-cols-1fr/auto grid items-start justify-between gap-x-32"
      onSubmit={handleSubmit(submit)}
    >
      <div className="w-full grid gap-y-6">
        <h1 className="text-lg font-[550]">Output parameters</h1>
        <div className="grid gap-y-8">
          <Input
            register={register("signal")}
            helperText="Enter the signal as passed to IDKit"
            label="Signal"
            placeholder="my_signal"
          />
          <TextArea
            register={register("verification_response")}
            helperText="These are the parameters you get from the JS widget"
            label="Verification response"
            errors={errors?.verification_response}
            placeholder={exampleVR}
            className="h-[200px] py-1"
          />
          <DecoratedButton
            type="button"
            className="w-44 text-sm"
            onClick={() => handleSubmit(formatCode)()}
          >
            Format Response
          </DecoratedButton>
        </div>
      </div>
      <div className="w-full grid gap-y-6 md:min-w-[480px]">
        <h1 className="text-lg font-[550]">Results</h1>
        <div
          className={clsx(
            "w-full h-80 bg-grey-50 border border-grey-100 flex flex-col items-center justify-center rounded-lg",
            {
              "bg-system-success-50 border-0": status === Status.SUCCESS,
              "bg-system-error-50 border-0": status === Status.ERROR,
            }
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
            {status === Status.SUCCESS && <CheckIcon className="" />}
            {status === Status.ERROR && <CloseIcon className="w-5 h-5" />}
          </CircleIconContainer>
          <div className="flex flex-col items-center gap-y-5 mt-8 px-12 text-center">
            <p
              className={clsx("text-grey-400 text-sm", {
                "text-system-error-600": status === Status.ERROR,
                "text-system-success-600": status === Status.SUCCESS,
              })}
            >
              {message}
            </p>
            <DecoratedButton
              type="submit"
              variant="secondary"
              className="w-60 text-grey-700"
              disabled={!isDirty || !isValid}
            >
              Validate Proof
            </DecoratedButton>
          </div>
        </div>
      </div>
    </form>
  );
};
