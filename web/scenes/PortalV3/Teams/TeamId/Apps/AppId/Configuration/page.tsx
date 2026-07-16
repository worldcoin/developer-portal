"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { ErrorPage } from "@/components/ErrorPage";
import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { urls } from "@/lib/urls";
import clsx from "clsx";
import Link from "next/link";
import { useAtom } from "jotai";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Skeleton from "react-loading-skeleton";
import { useParams } from "next/navigation";
import { MiniAppConfiguration } from "./MiniAppConfiguration";
import { FormSkeleton } from "./PageComponents/FormSkeleton";
import { AppStoreForm } from "./AppStore/app-store";
import { AppStoreFormProvider } from "./AppStore/app-store-form-provider";
import {
  AppMetadata,
  LocalisationData,
} from "./AppStore/types/AppStoreFormTypes";
import { BasicInformation, BasicInformationHandle } from "./BasicInformation";
import { useFetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { isMiniAppAtom, viewModeAtom } from "./layout/ImagesProvider";
import { useFetchLocalisationsQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import { AppIconBox } from "./PageComponents/AppIconBox";
import {
  ConfigurationWizard,
  getConfigurationSteps,
  getStepForField,
} from "./PageComponents/ConfigurationWizard";
import type { ConfigurationStepId } from "./PageComponents/ConfigurationWizard";
import { NumberedSection } from "./PageComponents/NumberedSection";
import { RejectionBanner } from "./RejectionBanner";
import { ResolveModal } from "./ResolveModal";
import { DraftSavedLine, ReviewRail, SubmitForReview } from "./ReviewRail";
import { SaveStatusProvider } from "./SaveStatus";
import { useCreateNewDraft } from "./hook/use-create-new-draft";
import { useRemoveFromReview } from "@/scenes/common/Teams/TeamId/Apps/common/hooks/use-remove-from-review";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";

type AppProfilePageProps = {
  params: Record<string, string> | null | undefined;
};

type ConfigurationContentProps = {
  appId: `app_${string}`;
  teamId: `team_${string}`;
  app: FetchAppMetadataQuery["app"][0];
  appMetadata: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  teamName: string;
};

// Quiet pill shared by the footer's secondary actions (version switch, back,
// danger zone) so the primary Continue/Submit button is the loudest element.
const ghostActionClassName =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-grey-500 transition-colors hover:bg-grey-50 hover:text-grey-900 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Ghost version switch — the only trace of draft/verified state on the page,
 * deliberately indicator-free so the form-filling UI stays the focus.
 * Creates the one allowed draft on first use (useCreateNewDraft enforces
 * the limit).
 */
const VersionSwitchButton = ({
  app,
  appId,
  teamId,
}: {
  app: FetchAppMetadataQuery["app"][0];
  appId: `app_${string}`;
  teamId: `team_${string}`;
}) => {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const hasDraft = app.app_metadata.length > 0;
  const hasVerified = app.verified_app_metadata.length > 0;

  const { createNewDraft, isCreating } = useCreateNewDraft({
    appId,
    teamId,
    hasDraft,
    hasVerifiedVersion: hasVerified,
  });

  // Creating a draft mutates review state — same Owner/Admin bar the old
  // AppTopBar action had. Viewing an existing row is unrestricted.
  const canManageDraft = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);

  // Nothing to switch between before first verification.
  if (!hasVerified) return null;

  if (viewMode === "verified") {
    if (!hasDraft && !canManageDraft) return null;
    return (
      <button
        type="button"
        disabled={isCreating}
        className={ghostActionClassName}
        onClick={() => {
          if (hasDraft) {
            setViewMode("unverified");
          } else {
            // Flips the view itself after the row lands.
            void createNewDraft();
          }
        }}
      >
        <Icon name="edit-pencil" className="size-3.5" />
        <Typography variant={TYPOGRAPHY.R5} className="whitespace-nowrap">
          {isCreating ? "Opening…" : "Open draft"}
        </Typography>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={ghostActionClassName}
      onClick={() => setViewMode("verified")}
    >
      <Icon name="eye" className="size-3.5" />
      <Typography variant={TYPOGRAPHY.R5} className="whitespace-nowrap">
        View verified version
      </Typography>
    </button>
  );
};

/**
 * Floored actions beneath the storyboard row — bare (no boxed dock). Back +
 * Continue are the always-present way to switch panels; the right cluster
 * carries the quiet extras (version switch, danger zone) and the state's
 * primary action on the last step: submit while drafting, un-submit while
 * the draft awaits review.
 */
const ActionsFooter = ({
  app,
  appId,
  teamId,
  basicInfoRef,
  onValidationError,
  steps,
  activeStep,
  onStepChange,
}: {
  app: FetchAppMetadataQuery["app"][0];
  appId: `app_${string}`;
  teamId: `team_${string}`;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
  onValidationError?: (fieldPath?: string) => void;
  steps: ReturnType<typeof getConfigurationSteps>;
  activeStep: ConfigurationStepId;
  onStepChange: (step: ConfigurationStepId) => void;
}) => {
  const [viewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const hasVerified = app.verified_app_metadata.length > 0;
  const draft = app.app_metadata[0];

  const { removeFromReview, loading: isUnsubmitting } = useRemoveFromReview({
    metadataId: draft?.id,
  });

  const canManageDraft = checkUserPermissions(user, teamId ?? "", [
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

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 lg:mr-6">
      <button
        type="button"
        disabled={!previousStep}
        className={ghostActionClassName}
        onClick={() => {
          if (previousStep) onStepChange(previousStep.id);
        }}
      >
        <ChevronLeftIcon className="size-3.5" />
        <Typography variant={TYPOGRAPHY.R5}>Back</Typography>
      </button>

      <div className="hidden min-w-0 sm:block">
        {isEditable ? (
          <DraftSavedLine />
        ) : isAwaiting ? (
          <Typography
            variant={TYPOGRAPHY.R5}
            className="min-w-0 truncate text-grey-500"
          >
            In review — editing is locked until review completes.
          </Typography>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-2">
        <VersionSwitchButton app={app} appId={appId} teamId={teamId} />

        <Link
          href={urls.configurationDanger({ team_id: teamId, app_id: appId })}
          className={clsx(
            ghostActionClassName,
            "text-grey-400 hover:bg-system-error-50 hover:text-system-error-600",
          )}
        >
          <TrashIcon className="size-3.5" />
          <Typography variant={TYPOGRAPHY.R5}>Danger zone</Typography>
        </Link>

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

        {nextStep ? (
          <DecoratedButton
            type="button"
            showArrowRight
            aria-label={`Continue to ${nextStep.title}`}
            className="ml-2 h-9 shrink-0 px-4 py-1.5"
            onClick={() => onStepChange(nextStep.id)}
          >
            <Typography variant={TYPOGRAPHY.M4}>Continue</Typography>
          </DecoratedButton>
        ) : isEditable ? (
          <SubmitForReview
            appId={appId}
            teamId={teamId}
            appMetadata={draft}
            basicInfoRef={basicInfoRef}
            onValidationError={onValidationError}
            className="ml-2 h-9 px-4 py-1.5"
          />
        ) : null}
      </div>
    </div>
  );
};

// Rendered inside AppStoreFormProvider so the review-readiness rail can watch
// the shared form context.
const ConfigurationContent = ({
  appId,
  teamId,
  app,
  appMetadata,
  teamName,
}: ConfigurationContentProps) => {
  const basicInfoRef = useRef<BasicInformationHandle>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [optimisticIsMiniApp, setOptimisticIsMiniApp] = useAtom(isMiniAppAtom);
  const [modeMetadataId, setModeMetadataId] = useState<string | null>(null);
  const isMiniApp =
    modeMetadataId === appMetadata.id
      ? optimisticIsMiniApp
      : appMetadata.app_mode === "mini-app";
  const steps = useMemo(() => getConfigurationSteps(isMiniApp), [isMiniApp]);
  const [activeStep, setActiveStep] = useState<ConfigurationStepId>("basic");

  const handleStepChange = useCallback((step: ConfigurationStepId) => {
    setActiveStep(step);
    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
    });
  }, []);

  // Seed the optimistic mode atom from the row before using it for later
  // in-place mode changes. Until this row is synced, derive the first render
  // directly from metadata so the step count never flashes from 3 to 4.
  useEffect(() => {
    setOptimisticIsMiniApp(appMetadata.app_mode === "mini-app");
    setModeMetadataId(appMetadata.id);
  }, [appMetadata.app_mode, appMetadata.id, setOptimisticIsMiniApp]);

  useEffect(() => {
    if (!steps.some((step) => step.id === activeStep)) {
      handleStepChange("availability");
    }
  }, [activeStep, handleStepChange, steps]);

  const handleValidationError = useCallback(
    (fieldPath?: string) => {
      const targetStep = getStepForField(fieldPath);
      handleStepChange(
        steps.some((step) => step.id === targetStep) ? targetStep : "basic",
      );
    },
    [handleStepChange, steps],
  );

  return (
    <div className="grid gap-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(380px,31%)] lg:grid-rows-[minmax(0,1fr)]">
      {/* The form and its action shelf share one column. The horizontal
          storyboard keeps one chapter in focus while all form fields stay
          mounted so autosave and final validation keep their existing data. */}
      <div className="flex min-h-0 min-w-0 flex-col">
        <div
          ref={scrollContainerRef}
          className="grid min-w-0 content-start gap-y-6 pt-6 pb-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-6"
        >
          <NumberedSection
            number="01"
            title="Basic information"
            description="Start with the details people need to recognize and open your app."
            isActive={activeStep === "basic"}
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
                    Add the name and destinations people will use to find your
                    app.
                  </Typography>
                </div>
                <BasicInformation
                  ref={basicInfoRef}
                  appId={appId}
                  teamId={teamId}
                  app={app}
                  teamName={teamName}
                />
              </div>
            </div>
          </NumberedSection>

          <AppStoreForm
            appId={appId}
            teamId={teamId}
            appMetadata={appMetadata as AppMetadata}
            activeStep={activeStep}
          />
        </div>

        <ConfigurationWizard
          steps={steps}
          activeStep={activeStep}
          onStepChange={handleStepChange}
        />
        <ActionsFooter
          app={app}
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
      <ReviewRail appId={appId} teamName={teamName} appMetadata={appMetadata} />
    </div>
  );
};

export const AppProfilePage = ({ params }: AppProfilePageProps) => {
  const routeParams = useParams<{ appId: `app_${string}`; teamId: string }>();
  const appId = (params?.appId || routeParams?.appId) as `app_${string}`;
  const teamId = (params?.teamId || routeParams?.teamId) as `team_${string}`;
  const [viewMode, setViewMode] = useAtom(viewModeAtom);

  const {
    data,
    loading: isMetadataLoading,
    error,
  } = useFetchAppMetadataQuery({
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

  const { data: localisationsData, loading: isLocalisationsLoading } =
    useFetchLocalisationsQuery({
      variables: {
        app_metadata_id: appMetadata?.id || "",
      },
      skip: !appMetadata?.id,
    });

  const teamName = app?.team?.name ?? "";
  const isLoading = isMetadataLoading || isLocalisationsLoading;
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

  if (isLoading || !app || !appMetadata) {
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
          />
        </SizingWrapper>
      </SaveStatusProvider>
    </AppStoreFormProvider>
  );
};
