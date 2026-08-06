"use client";

import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { EditIcon } from "@/components/Icons/EditIcon";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useRemoveFromReview } from "@/scenes/common/Teams/TeamId/Apps/common/hooks/use-remove-from-review";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtom } from "jotai";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useFormContext } from "react-hook-form";
import { AppStoreForm } from "../AppStore/app-store";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { AppMetadata } from "../AppStore/types/AppStoreFormTypes";
import { AppStoreActions } from "../AppStoreActions";
import { BasicInformationHandle } from "../BasicInformation";
import type { BasicInformationFormValues } from "../BasicInformation/form-schema";
import { useCreateNewDraft } from "../hook/use-create-new-draft";
import { isMiniAppAtom, viewModeAtom } from "../layout/ImagesProvider";
import { SaveStatusIndicator, useSaveStatusActions } from "../SaveStatus";
import { SetupForm as MiniAppPermissionsForm } from "../../MiniApp/PermissionsForm";
import { AvailabilityStep } from "./AvailabilityStep";
import {
  BasicInformationStep,
  useResolvedLogoUrl,
  WizardLogoUpload,
} from "./BasicInformationStep";
import { LocalisedContentStep } from "./LocalisedContentStep";
import { ReviewStep } from "./ReviewStep";
import { StoreListingStep } from "./StoreListingStep";
import { Stepper } from "./Stepper";
import {
  AppStorePersistedPatch,
  cloneAppStoreFormValues,
  wizardPersistedDraftReducer,
} from "../persisted-draft";
import {
  getWizardStepForField,
  getWizardSteps,
  getWizardStepStatuses,
  WizardStep,
} from "./wizard-steps";

export const secondaryButtonClassName =
  "flex h-10 items-center justify-center rounded-[10px] bg-portal-canvas px-6 text-15 leading-[1.2] font-semibold text-portal-ink transition-colors hover:bg-portal-border disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-portal-canvas";
export const primaryButtonClassName =
  "flex h-10 items-center justify-center rounded-[10px] bg-portal-ink px-6 text-15 leading-[1.2] font-semibold text-white transition-colors hover:bg-portal-ink-hover disabled:cursor-not-allowed disabled:opacity-60";

// Frame chrome shared with Skeleton.tsx so the loading state can never drift
// from the loaded layout.
export const wizardFrameClassName =
  "flex h-[calc(100dvh-var(--portal-header-height))] w-full flex-col overflow-x-clip px-6 pt-[43px] font-world";
export const wizardStepperRowClassName =
  "relative flex w-full shrink-0 justify-center";
export const wizardScrollRegionClassName =
  "-mx-6 min-h-0 w-auto flex-1 overflow-x-hidden overflow-y-auto px-6 pb-8";
export const wizardLogoRowClassName = "mt-[76px] flex justify-center";
export const wizardBasicBodyClassName = "mx-auto mt-10 w-full max-w-[626px]";
export const wizardActionBarClassName =
  "-mx-6 shrink-0 border-t border-portal-border bg-white px-6 py-3";
export const wizardActionBarInnerClassName =
  "mx-auto flex w-full max-w-[626px] items-center gap-3";

/**
 * Q3 2026 configuration wizard (Figma: Dev Portal Q3 2026). The designed
 * steps bind straight into the machinery the previous page used — the shared
 * App Store form (autosave + language sync), the basic-information form, the
 * image upload pipeline, and the submit-for-review flow — so every behavior
 * from the previous configuration page keeps working.
 */
export const ConfigurationWizard = (props: {
  appId: `app_${string}`;
  teamId: `team_${string}`;
  app: FetchAppMetadataQuery["app"][0];
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  teamName: string;
  activeStep: WizardStep;
  setActiveStep: (step: WizardStep) => void;
  /**
   * Rendered inside the fixed frame, above the stepper — an alert placed
   * outside would push the docked action bar below the fold.
   */
  banner?: React.ReactNode;
  onVersionSwitchingChange?: (isSwitching: boolean) => void;
}) => {
  const {
    appId,
    teamId,
    app,
    appMetadata,
    teamName,
    activeStep,
    setActiveStep,
  } = props;
  const basicInfoRef = useRef<BasicInformationHandle>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const appStoreForm = useFormContext<AppStoreFormValues>();
  // Form values are edit buffers. Completion reads this single persisted
  // draft, updated only with the exact result of a successful save.
  const [persistedDraft, dispatchPersistedDraft] = useReducer(
    wizardPersistedDraftReducer,
    {
      basicInformation: {
        name: appMetadata.name ?? "",
        integration_url: appMetadata.integration_url ?? "",
        app_website_url: appMetadata.app_website_url ?? "",
      },
      appStore: cloneAppStoreFormValues(appStoreForm.getValues()),
    },
  );
  const { user } = useUser() as Auth0SessionUser;
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const saveStatusActions = useSaveStatusActions();
  const [isSwitchingVersion, setIsSwitchingVersion] = useState(false);
  const [showReviewValidationErrors, setShowReviewValidationErrors] =
    useState(false);
  const handleSavedEdit = useCallback((patch: AppStorePersistedPatch) => {
    dispatchPersistedDraft({ type: "app-store-saved", patch });
  }, []);
  const handleSelfPersistedEdit = useCallback(
    (update: (values: AppStoreFormValues) => AppStoreFormValues) => {
      dispatchPersistedDraft({ type: "app-store-self-persisted", update });
    },
    [],
  );
  const handleBasicInformationSavedEdit = useCallback(
    (patch: Partial<BasicInformationFormValues>) => {
      dispatchPersistedDraft({ type: "basic-information-saved", patch });
    },
    [],
  );

  // Seed the optimistic mode atom from the row before using it for later
  // in-place mode changes. Until this row is synced, derive the first render
  // directly from metadata so the step count never flashes.
  const [optimisticIsMiniApp, setOptimisticIsMiniApp] = useAtom(isMiniAppAtom);
  const [modeMetadataId, setModeMetadataId] = useState<string | null>(null);
  const isMiniApp =
    modeMetadataId === appMetadata.id
      ? optimisticIsMiniApp
      : appMetadata.app_mode === "mini-app";
  useEffect(() => {
    setOptimisticIsMiniApp(appMetadata.app_mode === "mini-app");
    setModeMetadataId(appMetadata.id);
  }, [appMetadata.app_mode, appMetadata.id, setOptimisticIsMiniApp]);

  const steps = useMemo(() => getWizardSteps(isMiniApp), [isMiniApp]);
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStep),
  );
  const nextStep = steps[activeIndex + 1];
  const resolvedLogoImageUrl = useResolvedLogoUrl(
    appId,
    appMetadata as AppMetadata,
  );
  const wizardStepStatuses = useMemo(
    () =>
      getWizardStepStatuses({
        isMiniApp,
        basicInformationFieldSnapshot: persistedDraft.basicInformation,
        appStoreFieldSnapshot: persistedDraft.appStore,
        logoImageFieldSnapshot: appMetadata.logo_img_url,
        contentCardImageFieldSnapshot: appMetadata.content_card_image_url,
        showReviewValidationErrors,
      }),
    [
      appMetadata.content_card_image_url,
      appMetadata.logo_img_url,
      isMiniApp,
      persistedDraft,
      showReviewValidationErrors,
    ],
  );

  const handleStepChange = useCallback(
    (step: WizardStep) => {
      setActiveStep(step);
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
    [setActiveStep],
  );

  // Switching to external drops the Mini App-only steps; land somewhere valid.
  useEffect(() => {
    if (!steps.some((step) => step.id === activeStep)) {
      handleStepChange(WizardStep.AVAILABILITY);
    }
  }, [activeStep, handleStepChange, steps]);

  const handleValidationError = useCallback(
    (fieldPath?: string) => {
      setShowReviewValidationErrors(true);
      const target = getWizardStepForField(isMiniApp, fieldPath);
      handleStepChange(
        steps.some((step) => step.id === target) ? target : WizardStep.BASIC,
      );
    },
    [handleStepChange, isMiniApp, steps],
  );

  // Draft lifecycle, mirroring the previous page's footer.
  const hasDraft = app.app_metadata.length > 0;
  const hasVerified = app.verified_app_metadata.length > 0;
  const draft = app.app_metadata[0];
  const { removeFromReview, loading: isUnsubmitting } = useRemoveFromReview({
    metadataId: draft?.id,
  });
  const { createNewDraft, isCreating } = useCreateNewDraft({
    appId,
    teamId,
    hasDraft,
    hasVerifiedVersion: hasVerified,
  });
  const canManageDraft = checkUserPermissions(user, teamId, [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);

  const isVerifiedView = viewMode === "verified" && hasVerified;
  const isAwaiting =
    !isVerifiedView && draft?.verification_status === "awaiting_review";
  const isEditable =
    !isVerifiedView && draft?.verification_status === "unverified";
  // Verified view without a draft: only Owner/Admin may create one.
  const showVersionAction =
    hasVerified && (!isVerifiedView || hasDraft || canManageDraft);

  const handleVersionAction = useCallback(async () => {
    setIsSwitchingVersion(true);
    props.onVersionSwitchingChange?.(true);

    try {
      const didFlush = (await saveStatusActions?.flushAll()) ?? true;
      if (!didFlush) return;

      if (!isVerifiedView) {
        setViewMode("verified");
        return;
      }
      if (hasDraft) {
        setViewMode("unverified");
        return;
      }

      await createNewDraft();
    } finally {
      setIsSwitchingVersion(false);
      props.onVersionSwitchingChange?.(false);
    }
  }, [
    createNewDraft,
    hasDraft,
    isVerifiedView,
    props.onVersionSwitchingChange,
    saveStatusActions,
    setViewMode,
  ]);

  const stepWrapperClassName = (step: WizardStep, marginClassName: string) =>
    clsx("w-full", marginClassName, activeStep !== step && "hidden");

  return (
    // Fixed frame filling the shell's scroll area (viewport minus the header,
    // via the shell's CSS variable): the stepper and action bar stay pinned
    // while the step content scrolls in its own region between them, like the
    // previous page's docked layout. overflow-x-clip keeps stray wide content
    // from ever handing the shell a horizontal scrollbar (which focus would
    // then jump along).
    <div
      data-testid="configuration-wizard"
      className={wizardFrameClassName}
      aria-busy={isSwitchingVersion}
      inert={isSwitchingVersion ? true : undefined}
    >
      {props.banner && (
        <div className="mx-auto mb-6 w-full max-w-[626px] shrink-0">
          {props.banner}
        </div>
      )}
      <div className={wizardStepperRowClassName}>
        <Stepper
          steps={steps}
          activeIndex={activeIndex}
          stepStatuses={wizardStepStatuses}
          onStepSelect={handleStepChange}
        />
        {/* Static cue for which version the form shows — not a control.
            Draft-only apps have a single version; nothing worth labelling. */}
        {hasVerified && (
          <div
            data-testid="configuration-version-indicator"
            role="img"
            aria-label={isVerifiedView ? "Verified version" : "Draft version"}
            title={isVerifiedView ? "Verified version" : "Draft version"}
            className="absolute top-1/2 right-0 -translate-y-1/2"
          >
            {isVerifiedView ? (
              <CheckmarkBadge className="size-4 text-system-warning-500" />
            ) : (
              <EditIcon className="size-4 text-grey-700" />
            )}
          </div>
        )}
      </div>

      {/* Every step stays mounted (inactive ones are CSS-hidden) so autosave
          debounces and review-time validation keep their field state, exactly
          like the previous page's sections. This is the wizard's only scroll
          region — min-h-0 lets it shrink inside the fixed flex frame, and
          overflow-x-hidden means wide content clips rather than ever growing
          a horizontal scrollbar. Full-bleed (-mx-6) so the scrollbar hugs the
          frame edge instead of floating beside the content column. */}
      <div ref={scrollContainerRef} className={wizardScrollRegionClassName}>
        <AppStoreForm
          appId={appId}
          teamId={teamId}
          appMetadata={appMetadata as AppMetadata}
          onSavedEdit={handleSavedEdit}
          onSelfPersistedEdit={handleSelfPersistedEdit}
        >
          <div
            className={stepWrapperClassName(WizardStep.BASIC, "")}
            aria-hidden={activeStep !== WizardStep.BASIC}
          >
            <div className={wizardLogoRowClassName}>
              <WizardLogoUpload
                appId={appId}
                teamId={teamId}
                appMetadata={appMetadata as AppMetadata}
                canEdit={isEditable && canManageDraft}
              />
            </div>
            <div className={wizardBasicBodyClassName}>
              <BasicInformationStep
                ref={basicInfoRef}
                appId={appId}
                teamId={teamId}
                app={app}
                appMetadata={appMetadata as AppMetadata}
                publisher={teamName}
                onSavedEdit={handleBasicInformationSavedEdit}
              />
            </div>
          </div>

          {isMiniApp && (
            <div
              className={stepWrapperClassName(
                WizardStep.STORE_LISTING,
                "mx-auto mt-[76px] max-w-[626px]",
              )}
              aria-hidden={activeStep !== WizardStep.STORE_LISTING}
            >
              <StoreListingStep />
            </div>
          )}

          <div
            className={stepWrapperClassName(
              WizardStep.AVAILABILITY,
              "mx-auto mt-[76px] max-w-[626px]",
            )}
            aria-hidden={activeStep !== WizardStep.AVAILABILITY}
          >
            <AvailabilityStep isMiniApp={isMiniApp} />
          </div>

          <div
            className={stepWrapperClassName(
              WizardStep.LOCALISED_CONTENT,
              "mx-auto mt-[76px] max-w-[626px]",
            )}
            aria-hidden={activeStep !== WizardStep.LOCALISED_CONTENT}
          >
            <LocalisedContentStep isMiniApp={isMiniApp} />
          </div>

          {isMiniApp && (
            <div
              className={stepWrapperClassName(
                WizardStep.MINI_APP_PERMISSIONS,
                "mx-auto mt-[76px] max-w-[626px]",
              )}
              aria-hidden={activeStep !== WizardStep.MINI_APP_PERMISSIONS}
            >
              <MiniAppPermissionsForm
                appId={appId}
                teamId={teamId}
                appMetadata={appMetadata}
              />
            </div>
          )}

          <div
            className={stepWrapperClassName(
              WizardStep.REVIEW,
              "mx-auto mt-[73px] max-w-[626px]",
            )}
            aria-hidden={activeStep !== WizardStep.REVIEW}
          >
            <ReviewStep
              teamName={teamName}
              isMiniApp={isMiniApp}
              logoUrl={resolvedLogoImageUrl || undefined}
            />
          </div>
        </AppStoreForm>
      </div>

      {/* Docked action bar: pinned below the scroll region, matching the
          previous page's fixed footer. */}
      <div className={wizardActionBarClassName}>
        <div className={wizardActionBarInnerClassName}>
          <div className="flex flex-1 justify-start">
            {/* Always rendered: a disabled Back on the first step reads as
                "you're at the start", where a missing button reads as broken. */}
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => handleStepChange(steps[activeIndex - 1].id)}
              className={secondaryButtonClassName}
            >
              Back
            </button>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-3">
            {showVersionAction && (
              <button
                type="button"
                disabled={isCreating || isSwitchingVersion}
                className={clsx(secondaryButtonClassName, "gap-2")}
                onClick={() => void handleVersionAction()}
              >
                {/* Named for the destination, not the current view — with the
                    destination's icon so the pair reads as a toggle. */}
                {isVerifiedView ? (
                  <EditIcon className={clsx("size-4", opticalIconClassName)} />
                ) : (
                  <CheckmarkBadge
                    className={clsx(
                      "size-4 text-system-warning-500",
                      opticalIconClassName,
                    )}
                  />
                )}
                {isVerifiedView ? "Go to draft" : "Go to Verified"}
              </button>
            )}

            <div className="hidden min-w-0 items-center sm:flex">
              {isAwaiting ? (
                <p className="min-w-0 truncate text-13 leading-[1.3] font-[350] text-portal-subtle">
                  In review. Editing is locked until review completes.
                </p>
              ) : isEditable ? (
                <SaveStatusIndicator />
              ) : null}
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {isAwaiting && canManageDraft && (
              <button
                type="button"
                disabled={isUnsubmitting}
                onClick={removeFromReview}
                className={secondaryButtonClassName}
              >
                {isUnsubmitting ? "Un-submitting…" : "Un-submit"}
              </button>
            )}

            <AppStoreActions
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata}
              nextStep={nextStep ? { title: nextStep.label } : undefined}
              onContinue={() => {
                if (nextStep) handleStepChange(nextStep.id);
              }}
              basicInfoRef={basicInfoRef}
              onValidationError={handleValidationError}
              className={primaryButtonClassName}
              hideArrowIcon
            />
          </div>
        </div>
      </div>
    </div>
  );
};
