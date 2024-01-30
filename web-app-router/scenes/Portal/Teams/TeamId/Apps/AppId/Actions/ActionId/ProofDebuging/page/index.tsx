"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import Link from "next/link";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { Input } from "@/components/Input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { TextArea } from "@/components/TextArea";
import { useDebuggerQuery } from "../../../graphql/debugger.generated";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { WorldcoinIcon } from "@/components/Icons/WorldCoinIcon";
import { useCallback, useEffect, useState } from "react";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import clsx from "clsx";
import JSON5 from "json5";

const testProofSchema = yup.object({
  signal: yup.string().optional(),
  verification_response: yup.string().required("This field is required"),
});

type ActionIdSettingsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

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

export const ActionIdProofDebugingPage = ({
  params,
}: ActionIdSettingsPageProps) => {
  const appID = params?.appId;
  const actionID = params?.actionId;

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

  // Effect to reset status and message when 'signal' or 'verification_response' changes
  useEffect(() => {
    if (isDirty) {
      setStatus(Status.IDLE);
      setMessage(messages.IDLE);
    }
  }, [signal, verificationResponse, isDirty]);

  const { data, loading } = useDebuggerQuery({
    variables: { action_id: actionID ?? "" },
  });

  const submit = async (formData: TestProofFormValues) => {
    try {
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
          is_staging: data?.action[0]?.app?.is_staging,
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

  const action = data?.action[0];

  if (loading || !action) {
    return <div></div>;
  } else {
    return (
      <div className="w-full h-full flex flex-col items-center ">
        <div className="grid gap-y-2 max-w-[1180px] w-full py-10">
          <div>
            <Link href=".." className="flex flex-row items-center gap-x-2">
              <CaretIcon className="h-3 w-3 text-grey-400 rotate-90" />
              <p className="text-grey-700 font-[400] text-xs">
                Back to Incognito Actions
              </p>
            </Link>
          </div>
          <div className="w-full flex justify-between items-center">
            <h1 className="text-grey-900 text-2xl font-[550] capitalize">
              {action.name}
            </h1>
            <DecoratedButton
              variant="secondary"
              href="https://docs.worldcoin.org/id/cloud"
              className="text-grey-700 py-3 px-7 "
            >
              <DocsIcon />
              Learn more
            </DecoratedButton>
          </div>
          <hr className="my-5 w-full text-grey-200 border-dashed" />
          <form
            className="w-full grid-cols-2 grid items-start justify-between gap-x-32"
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
                  className="h-[200px]"
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
            <div className="w-full grid gap-y-6">
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
                  {status === Status.SUCCESS && (
                    <CheckIcon className="text-system-success-500" />
                  )}
                  {status === Status.ERROR && (
                    <CloseIcon className="text-system-error-500 stroke-3 w-5 h-5" />
                  )}
                </CircleIconContainer>
                <div className="flex flex-col items-center gap-y-5 mt-8">
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
        </div>
      </div>
    );
  }
};
