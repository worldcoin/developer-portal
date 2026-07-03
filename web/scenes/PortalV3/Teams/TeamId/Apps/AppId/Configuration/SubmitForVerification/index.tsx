"use client";

import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useRemoveFromReview } from "@/scenes/Portal/Teams/TeamId/Apps/common/hooks/use-remove-from-review";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
import { MutableRefObject, useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { useAppStoreForm } from "../AppStore/hooks/useAppStoreForm";
import { AppMetadata } from "../AppStore/types/AppStoreFormTypes";
import { BasicInformationHandle } from "../BasicInformation";
import { useAutosaveWithStatus } from "../hook/use-autosave-with-status";
import { isMiniAppAtom } from "../layout/ImagesProvider";
import { SaveStatusIndicator } from "../SaveStatus";
import { SubmitAppModal } from "../AppTopBar/SubmitAppModal";
import { STEPS } from "./constants";
import { Stepper } from "./Stepper";
import { AppIconStep } from "./steps/AppIconStep";
import { DetailsStep } from "./steps/DetailsStep";
import { LocalizationStep } from "./steps/LocalizationStep";
import { PublishStep } from "./steps/PublishStep";
import { ShowcaseStep } from "./steps/ShowcaseStep";
import { UrlsStep } from "./steps/UrlsStep";
import { SubmittedForReviewScreen } from "./SubmittedForReviewScreen";
import { useSubmitForReview } from "./use-submit-for-review";

type VerificationWizardProps = {
  appId: `app_${string}`;
  teamId: `team_${string}`;
  app: FetchAppMetadataQuery["app"][0];
  appMetadata: AppMetadata;
  teamName: string;
  basicInfoRef: MutableRefObject<BasicInformationHandle | null>;
};

/**
 * "Submit for Verification" wizard. Renders the same information as the classic
 * stacked configuration page, but one step at a time behind a small horizontal
 * stepper. It reuses the existing form context: <useAppStoreForm> and the
 * app-store autosave run once here (exactly like <AppStoreForm> does), and each
 * step scene just composes existing section components with the shared control.
 *
 * The submit pipeline lives in <useSubmitForReview> (a duplicate of the one in
 * <AppTopBarSubmit>, wired only here) — the last step's footer button calls it
 * directly, with no <AppTopBar> rectangle and no `?submitForReview=true` URL
 * side-channel. Once the app is `awaiting_review`, this component swaps the
 * stepper/flow for <SubmittedForReviewScreen>, which lists the app + its status
 * and exposes an Un-submit action that returns the app to `unverified` and
 * lands the wizard back on the last step with fields editable again.
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
  const setIsMiniApp = useSetAtom(isMiniAppAtom);
  // Initialize mini-app mode from the persisted app_mode before any step
  // renders. <MiniAppConfiguration> (which also sets this atom) only mounts in
  // the final Publish step, so without this the earlier icon/details steps see
  // the atom's default `false` and hide required mini-app fields (content card
  // image, category, support, compliance, humans-only) — then submit validates
  // with the real app_mode and errors on fields the wizard never showed.
  // Toggling the mode in Publish still updates the atom optimistically; this
  // effect only re-runs when app_mode actually changes (e.g. after a save
  // refetch), so it never fights the optimistic update.
  useEffect(() => {
    setIsMiniApp(appMetadata.app_mode === "mini-app");
  }, [appMetadata.app_mode, setIsMiniApp]);
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
  const [showSubmitAppModal, setShowSubmitAppModal] = useState(false);

  const enIndex = useMemo(() => {
    const index = localisations.findIndex((l) => l.language === "en");
    return index === -1 ? 0 : index;
  }, [localisations]);

  const { submitForReview, isSubmittingForReview } = useSubmitForReview({
    appId,
    appMetadata,
    basicInfoRef,
    onSubmitSuccess: () => setShowSubmitAppModal(true),
  });

  const isInReview = appMetadata.verification_status === "awaiting_review";
  const { removeFromReview, loading: removeLoading } = useRemoveFromReview({
    metadataId: appMetadata.id,
  });

  const onAutosaveSuccess = () => {
    refetchAppMetadata();
    refetchLocalisations();
  };

  const currentStepId = STEPS[step].id;
  const isLastStep = step === STEPS.length - 1;
  const canSubmit = isEditable && isEnoughPermissions;

  const goNext = () => {
    if (isLastStep) {
      void submitForReview();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const hasRequiredImagesForAppStore = Boolean(
    appMetadata?.showcase_img_urls &&
      appMetadata?.showcase_img_urls?.length >= 1,
  );

  // Once submitted, replace the stepper/flow with the post-submit screen.
  // Un-submitting flips the status back to `unverified` (handled inside
  // useRemoveFromReview's refetch), and we pre-position the stepper on the
  // last step so the user lands back on the editable publish form.
  if (isInReview) {
    return (
      <SubmittedForReviewScreen
        appMetadata={appMetadata}
        unsubmitLoading={removeLoading}
        onUnsubmit={() => {
          setStep(STEPS.length - 1);
          void removeFromReview();
        }}
      />
    );
  }

  return (
    <>
      <SubmitAppModal
        open={showSubmitAppModal}
        setOpen={setShowSubmitAppModal}
        appMetadataId={appMetadata.id}
        canSubmitAppStore={hasRequiredImagesForAppStore}
        teamId={teamId}
        appId={appId}
        isDeveloperAllowListing={appMetadata?.is_developer_allow_listing}
      />

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
              disabled={(isLastStep && !canSubmit) || isSubmittingForReview}
              className="h-11"
            >
              <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
                {isSubmittingForReview
                  ? "Processing..."
                  : isLastStep
                    ? "Submit for review"
                    : "Next"}
              </Typography>
            </DecoratedButton>
          </div>
        </div>
      </SizingWrapper>
    </>
  );
};
