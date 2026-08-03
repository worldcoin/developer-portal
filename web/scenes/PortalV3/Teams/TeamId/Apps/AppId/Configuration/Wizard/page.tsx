"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { FetchLocalisationsDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useRemoveFromReview } from "@/scenes/common/Teams/TeamId/Apps/common/hooks/use-remove-from-review";
import { useQuery } from "@apollo/client/react";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppStoreFormProvider } from "../AppStore/app-store-form-provider";
import {
  AppMetadata,
  LocalisationData,
} from "../AppStore/types/AppStoreFormTypes";
import { viewModeAtom } from "../layout/ImagesProvider";
import { RejectionBanner } from "../RejectionBanner";
import { ResolveModal } from "../ResolveModal";
import { SaveStatusProvider } from "../SaveStatus";
import { ConfigurationWizard } from "./index";
import { ConfigurationWizardSkeleton } from "./Skeleton";
import { WizardStep } from "./Stepper";

type ConfigurationWizardPageProps = {
  params: Record<string, string> | null | undefined;
};

/**
 * Route entry for the redesigned configuration wizard. Mirrors the previous
 * page's data plumbing exactly: draft/verified row selection via the shared
 * view-mode atom, the keyed form provider (remounts on row/view change), the
 * save-status provider, and the rejection banner + resolve flow.
 */
export const ConfigurationWizardPage = ({
  params,
}: ConfigurationWizardPageProps) => {
  const routeParams = useParams<{ appId: `app_${string}`; teamId: string }>();
  const appId = (params?.appId || routeParams?.appId) as `app_${string}`;
  const teamId = (params?.teamId || routeParams?.teamId) as `team_${string}`;
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [isVersionSwitching, setIsVersionSwitching] = useState(false);

  // Lives here — ABOVE the keyed AppStoreFormProvider — so a provider remount
  // (metadata row change / view switch mid-autosave) can't yank the user back
  // to the first wizard step. Reset only when the route app changes.
  const [activeStep, setActiveStep] = useState<WizardStep>(WizardStep.BASIC);
  useEffect(() => {
    setActiveStep(WizardStep.BASIC);
  }, [appId]);

  const { data, loading, error } = useQuery(FetchAppMetadataDocument, {
    variables: { id: appId },
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

  // Single-version apps have nothing to switch between — normalize the shared
  // atom so stale state from another app can't select a missing row.
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
      variables: { app_metadata_id: appMetadata?.id || "" },
      skip: !appMetadata?.id,
    },
  );

  const [showResolveModal, setShowResolveModal] = useState(false);
  const isRejected = appMetadata?.verification_status === "changes_requested";
  const { removeFromReview } = useRemoveFromReview({
    metadataId: appMetadata?.id,
  });

  if (!loading && (error || !app)) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  if (loading || isLocalisationsLoading || !app || !appMetadata) {
    return <ConfigurationWizardSkeleton />;
  }

  return (
    <div className="relative w-full" aria-busy={isVersionSwitching}>
      <div
        className={isVersionSwitching ? "invisible" : undefined}
        aria-hidden={isVersionSwitching || undefined}
      >
        <AppStoreFormProvider
          key={`${appMetadata.id}-${viewMode}`}
          appMetadata={appMetadata as AppMetadata}
          localisationsData={
            (localisationsData?.localisations || []) as LocalisationData
          }
        >
          <SaveStatusProvider>
            <ResolveModal
              open={showResolveModal}
              setOpen={setShowResolveModal}
              reviewMessage={appMetadata?.review_message}
              onResolve={removeFromReview}
            />

            <ConfigurationWizard
              appId={appId}
              teamId={teamId}
              app={app}
              appMetadata={appMetadata}
              teamName={app.team?.name ?? ""}
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              onVersionSwitchingChange={setIsVersionSwitching}
              // Inside the wizard's fixed frame: rendered out here it would push
              // the docked action bar below the fold.
              banner={
                isRejected ? (
                  <RejectionBanner
                    message={appMetadata?.review_message}
                    onResolve={() => setShowResolveModal(true)}
                  />
                ) : undefined
              }
            />
          </SaveStatusProvider>
        </AppStoreFormProvider>
      </div>

      {isVersionSwitching && (
        <div
          data-testid="configuration-version-switch-skeleton"
          className="absolute inset-0 z-10 bg-white"
        >
          <ConfigurationWizardSkeleton />
        </div>
      )}
    </div>
  );
};
