"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import { MutableRefObject, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { useAppStoreForm } from "../AppStore/hooks/useAppStoreForm";
import { AppMetadata } from "../AppStore/types/AppStoreFormTypes";
import { AppTopBar } from "../AppTopBar";
import { BasicInformationHandle } from "../BasicInformation";
import { useAutosaveWithStatus } from "../hook/use-autosave-with-status";
import { isMiniAppAtom } from "../layout/ImagesProvider";
import { SaveStatusIndicator } from "../SaveStatus";
import { STEPS } from "./constants";
import { Stepper } from "./Stepper";
import { AppIconStep } from "./steps/AppIconStep";
import { DetailsStep } from "./steps/DetailsStep";
import { LocalizationStep } from "./steps/LocalizationStep";
import { PublishStep } from "./steps/PublishStep";
import { ShowcaseStep } from "./steps/ShowcaseStep";
import { UrlsStep } from "./steps/UrlsStep";

type VerificationWizardProps = {
  appId: `app_${string}`;
  teamId: `team_${string}`;
  app: FetchAppMetadataQuery["app"][0];
  appMetadata: AppMetadata;
  teamName: string;
  basicInfoRef: MutableRefObject<BasicInformationHandle | null>;
  onResolve: () => void;
};

/**
 * "Submit for Verification" wizard. Renders the same information as the classic
 * stacked configuration page, but one step at a time behind a small horizontal
 * stepper. It reuses the existing form context: <useAppStoreForm> and the
 * app-store autosave run once here (exactly like <AppStoreForm> does), and each
 * step scene just composes existing section components with the shared control.
 *
 * Must be rendered inside <AppStoreFormProvider> + <SaveStatusProvider> (the
 * configuration page already provides both).
 */
export const VerificationWizard = ({
  appId,
  teamId,
  app,
  appMetadata,
  teamName,
  basicInfoRef,
  onResolve,
}: VerificationWizardProps) => {
  const { user } = useUser() as Auth0SessionUser;
  const form = useFormContext<AppStoreFormValues>();

  const {
    control,
    errors,
    localisations,
    supportType,
    handleSupportTypeChange,
    submitSilent,
    isEditable,
    refetchAppMetadata,
    refetchLocalisations,
  } = useAppStoreForm(appId, appMetadata);

  const isEnoughPermissions = useMemo(
    () =>
      checkUserPermissions(user, teamId ?? "", [
        Role_Enum.Owner,
        Role_Enum.Admin,
      ]),
    [user, teamId],
  );

  const isMiniApp = useAtomValue(isMiniAppAtom);
  const supportedLanguages = useWatch({ control, name: "supported_languages" });

  // Single autosave registration for every app-store field across all steps —
  // the same one <AppStoreForm> uses. BasicInformation registers its own.
  useAutosaveWithStatus<AppStoreFormValues>({
    id: "app-store",
    form,
    enabled: isEditable && isEnoughPermissions,
    save: async (data, signal) => {
      await submitSilent(data, signal);
    },
  });

  const [step, setStep] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const enIndex = useMemo(() => {
    const index = localisations.findIndex((l) => l.language === "en");
    return index === -1 ? 0 : index;
  }, [localisations]);

  const onAutosaveSuccess = () => {
    refetchAppMetadata();
    refetchLocalisations();
  };

  const currentStepId = STEPS[step].id;
  const isLastStep = step === STEPS.length - 1;
  const canSubmit = isEditable && isEnoughPermissions;

  const goNext = () => {
    if (isLastStep) {
      // Reuse the existing, fully-validated submit pipeline in <AppTopBar>: it
      // auto-runs when `?submitForReview=true` is present, validating the app
      // store schema and opening <SubmitAppModal> on success. No duplication.
      router.replace(`${pathname}?submitForReview=true`);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <>
      <SizingWrapper variant="nav" gridClassName="order-2 pb-6 pt-10">
        <AppTopBar
          appId={appId}
          teamId={teamId}
          app={app}
          onResolve={onResolve}
          hasFormContext
          basicInfoRef={basicInfoRef}
        />
      </SizingWrapper>

      <SizingWrapper variant="nav" gridClassName="order-3">
        <div className="border-t border-grey-100" />
      </SizingWrapper>

      <SizingWrapper variant="nav" gridClassName="order-4 pb-8 pt-8">
        <div className="max-w-[700px]">
          <Stepper steps={STEPS} current={step} onStepClick={setStep} />
        </div>
      </SizingWrapper>

      <SizingWrapper variant="nav" gridClassName="order-5 pb-8">
        <div className="max-w-[700px]">
          {/* Kept mounted (hidden off-step) so BasicInformation's ref-based
              review validation participates when submitting from the last step. */}
          <div className={clsx(currentStepId !== "urls" && "hidden")}>
            <UrlsStep
              appId={appId}
              teamId={teamId}
              app={app}
              teamName={teamName}
              basicInfoRef={basicInfoRef}
            />
          </div>

          {currentStepId === "icon" && (
            <AppIconStep
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
              isMiniApp={isMiniApp}
              errors={errors}
            />
          )}

          {currentStepId === "showcase" && (
            <ShowcaseStep
              control={control}
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
              supportedLanguages={supportedLanguages}
              enIndex={enIndex}
              onAutosaveSuccess={onAutosaveSuccess}
            />
          )}

          {currentStepId === "details" && (
            <DetailsStep
              control={control}
              errors={errors}
              enIndex={enIndex}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
              isMiniApp={isMiniApp}
              supportType={supportType}
              onSupportTypeChange={handleSupportTypeChange}
            />
          )}

          {currentStepId === "localization" && (
            <LocalizationStep
              control={control}
              errors={errors}
              localisations={localisations}
              appMetadata={appMetadata}
              appId={appId}
              teamId={teamId}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
              supportedLanguages={supportedLanguages}
              onAutosaveSuccess={onAutosaveSuccess}
            />
          )}

          {currentStepId === "publish" && (
            <PublishStep
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata}
            />
          )}
        </div>
      </SizingWrapper>

      <SizingWrapper variant="nav" gridClassName="order-6 pb-24">
        <div className="flex max-w-[700px] items-center justify-between gap-x-4">
          <DecoratedButton
            type="button"
            variant="secondary"
            disabled={step === 0}
            onClick={goBack}
            className="h-11"
          >
            <span className="flex items-center gap-x-1">
              <ChevronLeftIcon className="size-4" />
              <Typography variant={TYPOGRAPHY.M3}>Back</Typography>
            </span>
          </DecoratedButton>

          <div className="flex items-center gap-x-3">
            <SaveStatusIndicator />
            <DecoratedButton
              type="button"
              onClick={goNext}
              disabled={isLastStep && !canSubmit}
              className="h-11"
            >
              <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
                {isLastStep ? "Submit for review" : "Next"}
              </Typography>
            </DecoratedButton>
          </div>
        </div>
      </SizingWrapper>
    </>
  );
};
