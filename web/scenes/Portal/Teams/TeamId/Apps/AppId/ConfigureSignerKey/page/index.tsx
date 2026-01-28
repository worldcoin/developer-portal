"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { WorldId40OptionCard } from "../../EnableWorldId40/WorldId40OptionCard";

export type SignerKeySetup = "generate" | "existing";

type FormValues = {
  signer_key_setup: SignerKeySetup;
};

const GENERATE_BULLETS = [
  { text: "Quick setup", variant: "check" as const },
  { text: "No existing infrastructure needed", variant: "check" as const },
];

export const ConfigureSignerKeyPage = () => {
  const { teamId, appId } = useParams() as {
    teamId: string;
    appId: string;
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") as "configuration" | "actions" | null;

  const defaultValues: FormValues = useMemo(
    () => ({ signer_key_setup: "generate" }),
    [],
  );

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues,
  });

  const onBack = useCallback(() => {
    if (!teamId || !appId) return;
    router.push(
      urls.enableWorldId40({
        team_id: teamId,
        app_id: appId,
        next: nextParam ?? "configuration",
      }),
    );
  }, [teamId, appId, nextParam, router]);

  const onContinue = useCallback(() => {
    if (!teamId || !appId) return;
    const redirect =
      nextParam === "configuration"
        ? urls.configuration({ team_id: teamId, app_id: appId })
        : urls.actions({ team_id: teamId, app_id: appId });
    router.push(redirect);
  }, [teamId, appId, nextParam, router]);

  return (
    <SizingWrapper gridClassName="grow flex justify-center pb-10 pt-10">
      <form
        onSubmit={handleSubmit(onContinue)}
        className="grid w-full max-w-[580px] gap-y-6"
      >
        <div className="grid gap-y-3">
          <Typography as="h1" variant={TYPOGRAPHY.H6}>
            Configure Signer Key
          </Typography>
          <Typography
            as="p"
            variant={TYPOGRAPHY.R3}
            className="text-grey-500"
          >
            Your signer key is used to sign proof requests. Choose how you want
            to set up your key:
          </Typography>
        </div>

        <div className="mt-[0.84rem] grid gap-y-4">
          <WorldId40OptionCard
            register={register("signer_key_setup")}
            option={{ value: "generate", label: "Generate new key" }}
            subtitle="We'll generate a secure key in your browser. You'll download the private key to use in your application."
            stampText="Recommended"
            bullets={GENERATE_BULLETS}
            testId="generate"
          />
          <WorldId40OptionCard
            register={register("signer_key_setup")}
            option={{ value: "existing", label: "Use Existing Key" }}
            subtitle="Provide the address of a key you already control."
            bullets={[]}
            testId="existing"
          />
        </div>

        <div className="flex justify-between gap-x-4">
          <DecoratedButton
            type="button"
            variant="secondary"
            className="py-3"
            onClick={onBack}
            testId="configure-signer-key-back"
          >
            Back
          </DecoratedButton>
          <DecoratedButton
            type="submit"
            variant="primary"
            className="py-3"
            testId="configure-signer-key-continue"
          >
            Continue
          </DecoratedButton>
        </div>
      </form>
    </SizingWrapper>
  );
};
