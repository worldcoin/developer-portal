"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { ErrorPage } from "@/components/ErrorPage";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { EditIcon } from "@/components/Icons/EditIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useRemoveFromReview } from "@/scenes/common/Teams/TeamId/Apps/common/hooks/use-remove-from-review";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Skeleton from "react-loading-skeleton";
import {
  AppStoreForm,
  AvailabilityFields,
  LawsAndRegulationsBanner,
  LocalizedContentFields,
  StoreListingFields,
} from "./AppStore/app-store";
import { AppStoreFormProvider } from "./AppStore/app-store-form-provider";
import {
  AppMetadata,
  LocalisationData,
} from "./AppStore/types/AppStoreFormTypes";
import { BasicInformation, BasicInformationHandle } from "./BasicInformation";
import { AppStoreActions } from "./AppStoreActions";
import { MiniAppConfiguration } from "./MiniAppConfiguration";
import { useQuery } from "@apollo/client/react";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { FetchLocalisationsDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import { AppIconBox } from "./PageComponents/AppIconBox";
import {
  AppStoreWizardStep,
  AppStoreWizard,
  getAppStoreWizardStep,
  getAppStoreWizardSteps,
  getStepForField,
} from "./PageComponents/AppStoreWizard";
import { FormSkeleton } from "./PageComponents/FormSkeleton";
import { NumberedSection } from "./PageComponents/NumberedSection";
import { RejectionBanner } from "./RejectionBanner";
import { ResolveModal } from "./ResolveModal";
import { LivePreview } from "./LivePreview";
import { SaveStatusIndicator, SaveStatusProvider } from "./SaveStatus";
import { useCreateNewDraft } from "./hook/use-create-new-draft";
import { isMiniAppAtom, viewModeAtom } from "./layout/ImagesProvider";

type AppProfilePageProps = {
  params: Record<string, string> | null | undefined;
};

type ConfigurationContentProps = {
  appId: `app_${string}`;
  teamId: `team_${string}`;
  app: FetchAppMetadataQuery["app"][0];
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  teamName: string;
  activeStep: AppStoreWizardStep;
  setActiveStep: (step: AppStoreWizardStep) => void;
};

const stepActionClassName =
  "inline-flex h-10 w-44 shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-center leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2";
const secondaryStepActionClassName = clsx(
  stepActionClassName,
  "border border-grey-200 bg-grey-0 text-grey-700 hover:bg-grey-50 disabled:cursor-not-allowed disabled:border-grey-100 disabled:text-grey-300",
);
const primaryStepActionClassName = clsx(
  stepActionClassName,
  "bg-grey-900 text-white hover:bg-grey-700 disabled:cursor-not-allowed disabled:bg-grey-100 disabled:text-grey-400",
);

/** Static top-right cue for which version the form shows — not a control. */
const VersionIndicator = ({
  app,
}: {
  app: FetchAppMetadataQuery["app"][0];
}) => {
  const [viewMode] = useAtom(viewModeAtom);
  const hasVerified = app.verified_app_metadata.length > 0;

  // Draft-only apps have a single version; nothing worth labelling.
  if (!hasVerified) return null;

  const isVerifiedView = viewMode === "verified";
  const label = isVerifiedView ? "Verified version" : "Draft version";
  return (
    <div
      data-testid="configuration-version-indicator"
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex size-4 shrink-0 items-center justify-center text-grey-500"
    >
      {isVerifiedView ? (
        <CheckmarkBadge className="size-4 text-system-warning-500" />
      ) : (
        <EditIcon className="size-4 text-grey-700" />
      )}
    </div>
  );
};

/**
 * Actions beneath the active section, without a boxed dock. Back and the
 * primary action are the persistent way to switch panels; the right cluster
 * carries the quiet extras and the persistent primary action, which becomes
 * Submit for review on the last step. Un-submit replaces it while the draft
 * awaits review.
 */
const ActionsFooter = ({
  app,
  appMetadata,
  appId,
  teamId,
  basicInfoRef,
  onValidationError,
  steps,
  activeStep,
  onStepChange,
}: {
  app: FetchAppMetadataQuery["app"][0];
  appMetadata: ConfigurationContentProps["appMetadata"];
  appId: `app_${string}`;
  teamId: `team_${string}`;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
  onValidationError?: (fieldPath?: string) => void;
  steps: ReturnType<typeof getAppStoreWizardSteps>;
  activeStep: AppStoreWizardStep;
  onStepChange: (step: AppStoreWizardStep) => void;
}) => {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
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

  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStep),
  );
  const previousStep = steps[activeIndex - 1];
  const nextStep = steps[activeIndex + 1];

  const isVerifiedView = viewMode === "verified" && hasVerified;
  const isAwaiting =
    !isVerifiedView && draft?.verification_status === "awaiting_review";
  const isEditable =
    !isVerifiedView && draft?.verification_status === "unverified";
  // Verified view without a draft: only Owner/Admin may create one.
  const showVersionAction =
    hasVerified && (!isVerifiedView || hasDraft || canManageDraft);
  return (
    // Three equal tracks so the version switch sits dead-center regardless
    // of how wide the Back or primary clusters are.
    <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 lg:mr-6">
      <button
        type="button"
        disabled={!previousStep}
        className={clsx(secondaryStepActionClassName, "justify-self-start")}
        onClick={() => {
          if (previousStep) onStepChange(previousStep.id);
        }}
      >
        <ChevronLeftIcon className="size-4" />
        <Typography variant={TYPOGRAPHY.M4} className="leading-none">
          Back
        </Typography>
      </button>

      <div className="flex min-w-0 items-center justify-center gap-3">
        {showVersionAction && (
          <button
            type="button"
            disabled={isCreating}
            className={secondaryStepActionClassName}
            onClick={() => {
              if (!isVerifiedView) {
                setViewMode("verified");
                return;
              }
              if (hasDraft) {
                setViewMode("unverified");
              } else {
                // The draft hook flips the view after the new row lands.
                void createNewDraft();
              }
            }}
          >
            {isVerifiedView ? (
              <EditIcon className="size-4" />
            ) : (
              <CheckmarkBadge className="size-4 text-system-warning-500" />
            )}
            <Typography variant={TYPOGRAPHY.M4} className="leading-none">
              {isVerifiedView ? "New draft" : "Verified"}
            </Typography>
          </button>
        )}

        <div className="hidden min-w-0 items-center sm:flex">
          {isAwaiting ? (
            <Typography
              variant={TYPOGRAPHY.R5}
              className="min-w-0 truncate text-grey-500"
            >
              Editing is locked while your app is in review.
            </Typography>
          ) : isEditable ? (
            <SaveStatusIndicator />
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-1 gap-y-2">
        {isAwaiting && canManageDraft && (
          <DecoratedButton
            type="button"
            variant="secondary"
            className="ml-2 h-9 shrink-0 px-3 py-1.5"
            loading={isUnsubmitting}
            onClick={removeFromReview}
          >
            <Typography variant={TYPOGRAPHY.M4} className="whitespace-nowrap">
              Un-submit
            </Typography>
          </DecoratedButton>
        )}

        <AppStoreActions
          appId={appId}
          teamId={teamId}
          appMetadata={appMetadata}
          nextStep={nextStep}
          onContinue={() => {
            if (nextStep) onStepChange(nextStep.id);
          }}
          basicInfoRef={basicInfoRef}
          onValidationError={onValidationError}
          className={clsx(primaryStepActionClassName, "ml-2")}
        />
      </div>
    </div>
  );
};

// Rendered inside AppStoreFormProvider so the live preview can watch the shared
// form context.
const ConfigurationContent = ({
  appId,
  teamId,
  app,
  appMetadata,
  teamName,
  activeStep,
  setActiveStep,
}: ConfigurationContentProps) => {
  const basicInfoRef = useRef<BasicInformationHandle>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [optimisticIsMiniApp, setOptimisticIsMiniApp] = useAtom(isMiniAppAtom);
  const [modeMetadataId, setModeMetadataId] = useState<string | null>(null);
  const isMiniApp =
    modeMetadataId === appMetadata.id
      ? optimisticIsMiniApp
      : appMetadata.app_mode === "mini-app";
  const steps = useMemo(() => getAppStoreWizardSteps(isMiniApp), [isMiniApp]);

  const handleStepChange = useCallback(
    (step: AppStoreWizardStep) => {
      setActiveStep(step);
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
      });
    },
    [setActiveStep],
  );

  // Seed the optimistic mode atom from the row before using it for later
  // in-place mode changes. Until this row is synced, derive the first render
  // directly from metadata so the step count never flashes from 3 to 4.
  useEffect(() => {
    setOptimisticIsMiniApp(appMetadata.app_mode === "mini-app");
    setModeMetadataId(appMetadata.id);
  }, [appMetadata.app_mode, appMetadata.id, setOptimisticIsMiniApp]);

  useEffect(() => {
    if (!steps.some((step) => step.id === activeStep)) {
      handleStepChange(AppStoreWizardStep.AVAILABILITY);
    }
  }, [activeStep, handleStepChange, steps]);

  const handleValidationError = useCallback(
    (fieldPath?: string) => {
      const targetStep = getStepForField(fieldPath);
      handleStepChange(
        steps.some((step) => step.id === targetStep)
          ? targetStep
          : AppStoreWizardStep.BASIC,
      );
    },
    [handleStepChange, steps],
  );

  return (
    <div className="grid gap-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(380px,31%)] lg:grid-rows-[minmax(0,1fr)]">
      {/* The form and its actions share one column. The step flow keeps one
          section in focus while all form fields stay
          mounted so autosave and final validation keep their existing data. */}
      <div className="flex min-h-0 min-w-0 flex-col">
        <div
          ref={scrollContainerRef}
          className="grid min-w-0 content-start gap-y-6 pt-6 pb-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-6"
        >
          <AppStoreWizard
            steps={steps}
            activeStep={activeStep}
            accessory={<VersionIndicator app={app} />}
          />

          <NumberedSection
            step={getAppStoreWizardStep(isMiniApp, AppStoreWizardStep.BASIC)}
            isActive={activeStep === AppStoreWizardStep.BASIC}
          >
            <div className="grid gap-y-6">
              <div className="grid gap-4 xl:grid-cols-[11.75rem_minmax(0,1fr)]">
                <AppIconBox
                  appId={appId}
                  teamId={teamId}
                  appMetadataId={appMetadata.id}
                  logoFile={appMetadata.logo_img_url}
                  isEditable={appMetadata.verification_status === "unverified"}
                  verificationStatus={appMetadata.verification_status}
                />

                <MiniAppConfiguration
                  appId={appId}
                  teamId={teamId}
                  appMetadata={appMetadata as AppMetadata}
                />
              </div>

              <div className="border-t border-grey-100 pt-6">
                <div className="mb-5 grid gap-y-1">
                  <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
                    App details
                  </Typography>
                  <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                    Add the name and links people use to open your app.
                  </Typography>
                </div>
                <BasicInformation
                  ref={basicInfoRef}
                  appId={appId}
                  teamId={teamId}
                  app={app}
                  teamName={teamName}
                  isMiniApp={isMiniApp}
                />
              </div>
            </div>
          </NumberedSection>

          <AppStoreForm
            appId={appId}
            teamId={teamId}
            appMetadata={appMetadata as AppMetadata}
          >
            {isMiniApp && (
              <NumberedSection
                step={getAppStoreWizardStep(
                  isMiniApp,
                  AppStoreWizardStep.STORE_LISTING,
                )}
                isActive={activeStep === AppStoreWizardStep.STORE_LISTING}
              >
                <StoreListingFields />
              </NumberedSection>
            )}

            <NumberedSection
              step={getAppStoreWizardStep(
                isMiniApp,
                AppStoreWizardStep.AVAILABILITY,
              )}
              isActive={activeStep === AppStoreWizardStep.AVAILABILITY}
              banner={isMiniApp ? <LawsAndRegulationsBanner /> : undefined}
            >
              <AvailabilityFields />
            </NumberedSection>

            <NumberedSection
              step={getAppStoreWizardStep(
                isMiniApp,
                AppStoreWizardStep.LOCALIZED_CONTENT,
              )}
              isActive={activeStep === AppStoreWizardStep.LOCALIZED_CONTENT}
            >
              <LocalizedContentFields />
            </NumberedSection>
          </AppStoreForm>
        </div>

        <ActionsFooter
          app={app}
          appMetadata={appMetadata}
          appId={appId}
          teamId={teamId}
          basicInfoRef={basicInfoRef}
          onValidationError={handleValidationError}
          steps={steps}
          activeStep={activeStep}
          onStepChange={handleStepChange}
        />
      </div>

      {/* The preview is a read-only visual aid; page actions live with the
          form in the neighboring column. */}
      <LivePreview
        appId={appId}
        teamName={teamName}
        appMetadata={appMetadata}
      />
    </div>
  );
};

export const AppProfilePage = ({ params }: AppProfilePageProps) => {
  const routeParams = useParams<{ appId: `app_${string}`; teamId: string }>();
  const appId = (params?.appId || routeParams?.appId) as `app_${string}`;
  const teamId = (params?.teamId || routeParams?.teamId) as `team_${string}`;
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  // Lives here — ABOVE the keyed AppStoreFormProvider — so a provider remount
  // (metadata row change / view switch mid-autosave) can't yank the user back
  // to the first wizard step. Reset only when the route app changes; do not
  // key this on appMetadata.id or the lift would be pointless.
  const [activeStep, setActiveStep] = useState<AppStoreWizardStep>(
    AppStoreWizardStep.BASIC,
  );

  useEffect(() => {
    setActiveStep(AppStoreWizardStep.BASIC);
  }, [appId]);

  const {
    data,
    loading: isMetadataLoading,
    error,
  } = useQuery(FetchAppMetadataDocument, {
    variables: {
      id: appId,
    },
  });

  const app = data?.app[0];

  const appMetadata = useMemo(() => {
    const draftMetadata = app?.app_metadata?.[0];
    const verifiedMetadata = app?.verified_app_metadata?.[0];

    if (viewMode === "verified") {
      return verifiedMetadata ?? draftMetadata;
    }

    return draftMetadata ?? verifiedMetadata;
  }, [app, viewMode]);

  useEffect(() => {
    if (!app) return;

    const hasDraft = app.app_metadata.length > 0;
    const hasVerified = app.verified_app_metadata.length > 0;

    if (!hasDraft && hasVerified && viewMode !== "verified") {
      setViewMode("verified");
    } else if (!hasVerified && hasDraft && viewMode !== "unverified") {
      setViewMode("unverified");
    }
  }, [app, setViewMode, viewMode]);

  const { data: localisationsData, loading: isLocalisationsLoading } = useQuery(
    FetchLocalisationsDocument,
    {
      variables: {
        app_metadata_id: appMetadata?.id || "",
      },
      skip: !appMetadata?.id,
    },
  );

  const teamName = app?.team?.name ?? "";
  // A refetch keeps the previous Apollo data available. Reserve the full-page
  // skeleton for a cold load so background reconciliation does not unmount the
  // configuration form.
  const isInitialLoading =
    (isMetadataLoading && !data) ||
    (isLocalisationsLoading && !localisationsData);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const isRejected = appMetadata?.verification_status === "changes_requested";

  const { removeFromReview } = useRemoveFromReview({
    metadataId: appMetadata?.id,
  });

  if (!isMetadataLoading && (error || !app)) {
    return (
      <SizingWrapper variant="nav" gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="App not found" />
      </SizingWrapper>
    );
  }

  if (isInitialLoading || !app || !appMetadata) {
    return (
      <>
        <SizingWrapper variant="nav" gridClassName="order-1 pt-8">
          <Skeleton count={2} height={50} />
          <hr className="my-5 w-full border-dashed text-grey-200" />
        </SizingWrapper>

        <SizingWrapper variant="nav" gridClassName="order-2 pb-8 pt-4">
          <FormSkeleton count={4} />
        </SizingWrapper>
      </>
    );
  }

  return (
    <AppStoreFormProvider
      key={`${appMetadata.id}-${viewMode}`}
      appMetadata={appMetadata as AppMetadata}
      localisationsData={
        (localisationsData?.localisations || []) as LocalisationData
      }
    >
      <SaveStatusProvider>
        {/* Resolve Modal */}
        <ResolveModal
          open={showResolveModal}
          setOpen={setShowResolveModal}
          reviewMessage={appMetadata?.review_message}
          onResolve={removeFromReview}
        />

        {/* Rejection Warning Banner */}
        {isRejected && (
          <SizingWrapper variant="nav" gridClassName="order-1 pt-6">
            <RejectionBanner
              message={appMetadata?.review_message}
              onResolve={() => {
                setShowResolveModal(true);
              }}
            />
          </SizingWrapper>
        )}

        {/* Left-aligned full-width app frame (overrides SizingWrapper's
            centered column): fills the viewport below the shell's 67px
            header, so the window never scrolls — the form column scrolls
            internally and the preview pane stays fixed in place. */}
        <SizingWrapper
          className="min-w-0 lg:h-full"
          gridClassName={clsx(
            "order-2 grid-cols-[40px_minmax(0,1fr)_40px]",
            // Cap the single implicit row at the container height — without
            // this the row auto-sizes to the tall form and overflow-hidden
            // just clips it, leaving nothing scrollable. The 67px must match
            // ShellFrame's header height exactly or the window grows a
            // permanent sliver of scroll.
            "lg:h-[calc(100dvh-67px)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden",
          )}
        >
          <ConfigurationContent
            appId={appId}
            teamId={teamId}
            app={app}
            appMetadata={appMetadata}
            teamName={teamName}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
        </SizingWrapper>
      </SaveStatusProvider>
    </AppStoreFormProvider>
  );
};
