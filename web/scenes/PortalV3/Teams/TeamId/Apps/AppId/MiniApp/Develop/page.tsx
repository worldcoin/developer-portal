"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { ErrorPage } from "@/components/ErrorPage";
import { InformationCircleIcon } from "@/components/Icons/InformationCircleIcon";
import { Typography } from "@/components/Typography";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Role_Enum } from "@/graphql/graphql";
import { inferHttps } from "@/lib/schema";
import type { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import {
  FetchAppMetadataDocument,
  type FetchAppMetadataQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { use } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  schema as basicInformationSchema,
  type BasicInformationFormValues,
} from "../../Configuration/BasicInformation/form-schema";
import { validateAndSubmitServerSide } from "../../Configuration/BasicInformation/server/submit";
import { FormSkeleton } from "../../Configuration/PageComponents/FormSkeleton";
import {
  SaveStatusIndicator,
  SaveStatusProvider,
} from "../../Configuration/SaveStatus";
import { TextField } from "../../Configuration/Wizard/TextField";
import { useAutosaveWithStatus } from "../../Configuration/hook/use-autosave-with-status";
import { useCreateNewDraft } from "../../Configuration/hook/use-create-new-draft";
import { MiniAppPreviewCard } from "./MiniAppPreviewCard";

type DevelopPageProps = {
  params: Promise<Record<string, string>>;
};

type DevelopFormValues = Pick<BasicInformationFormValues, "integration_url">;

const developFormSchema = basicInformationSchema.pick(["integration_url"]);

export const DevelopContent = ({
  appId,
  teamId,
  app,
}: {
  appId: `app_${string}`;
  teamId: `team_${string}`;
  app: FetchAppMetadataQuery["app"][0];
}) => {
  const { user } = useUser() as Auth0SessionUser;
  const apolloClient = useApolloClient();
  const draftMetadata = app.app_metadata[0];
  const verifiedMetadata = app.verified_app_metadata[0];
  const appMetadata = draftMetadata ?? verifiedMetadata;
  const hasDraft = Boolean(draftMetadata);
  const hasVerified = Boolean(verifiedMetadata);

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
  const isDraftEditable = appMetadata?.verification_status === "unverified";
  const canEdit = isDraftEditable && canManageDraft;

  const form = useForm<DevelopFormValues>({
    resolver: yupResolver(developFormSchema),
    mode: "onChange",
    defaultValues: {
      integration_url: appMetadata?.integration_url ?? "",
    },
  });
  const {
    control,
    setValue,
    formState: { errors },
  } = form;

  useAutosaveWithStatus<DevelopFormValues>({
    id: "mini-app-develop-url",
    form,
    enabled: canEdit,
    save: async (values, signal) => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const result = await validateAndSubmitServerSide(
        appMetadata?.id ?? "",
        appId,
        values,
      );
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (!result.success) throw new Error(result.message);

      if (appMetadata?.id) {
        const cacheId = apolloClient.cache.identify({
          __typename: "app_metadata",
          id: appMetadata.id,
        });
        if (cacheId) {
          apolloClient.cache.modify({
            id: cacheId,
            fields: {
              integration_url: () => values.integration_url ?? "",
            },
          });
        }
      }
    },
  });

  if (!appMetadata) {
    return <ErrorPage statusCode={404} title="App metadata not found" />;
  }

  const isVerifiedOnly = !hasDraft && hasVerified;
  const isInReview = appMetadata.verification_status === "awaiting_review";
  const needsResolution =
    appMetadata.verification_status === "changes_requested";

  return (
    <div className="grid gap-y-10 pt-8 pb-12">
      <div className="grid gap-y-2">
        <Typography
          as="h1"
          className="font-world text-[26px] leading-[120%] font-semibold tracking-[-0.01em] text-[#191C20]"
        >
          Develop
        </Typography>
        <Typography
          as="p"
          className="font-world text-[15px] leading-[130%] font-medium text-grey-500"
        >
          Set the URL World App opens and preview your Mini App.
        </Typography>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-x-12 xl:gap-x-20">
        <div className="grid w-full gap-y-8 lg:max-w-[620px]">
          <section className="grid gap-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <Typography
                  as="h2"
                  className="font-world text-[17px] leading-[120%] font-medium text-grey-900"
                >
                  App URL
                </Typography>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="About the App URL"
                      className={`mb-1 rounded-full text-grey-300 outline-hidden transition-colors hover:text-grey-500 focus-visible:text-grey-500 focus-visible:ring-2 focus-visible:ring-grey-300 ${opticalIconClassName}`}
                    >
                      <InformationCircleIcon className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="max-w-xs text-left leading-5"
                  >
                    <span className="block max-w-[280px] whitespace-normal">
                      While developing, use ngrok or a similar tunneling service
                      to expose your local app over HTTPS and preview it in
                      World App. Replace it with your production URL before
                      submitting for review.
                    </span>
                  </TooltipContent>
                </Tooltip>
              </div>
              {canEdit && <SaveStatusIndicator />}
            </div>

            <Controller
              control={control}
              name="integration_url"
              render={({ field }) => (
                <TextField
                  label="App URL"
                  name="integration_url"
                  type="url"
                  required
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={() => {
                    field.onBlur();
                    const inferred = inferHttps(field.value ?? "");
                    if (inferred !== field.value) {
                      setValue("integration_url", inferred, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  disabled={!canEdit}
                  error={errors.integration_url?.message}
                />
              )}
            />

            {isVerifiedOnly && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-grey-50 p-4">
                <Typography className="font-world text-[13px] leading-[130%] font-medium text-grey-700">
                  This is the verified App URL. Create a draft before making
                  changes.
                </Typography>
                {canManageDraft && (
                  <DecoratedButton
                    type="button"
                    variant="secondary"
                    loading={isCreating}
                    onClick={() => void createNewDraft()}
                    className="h-10 shrink-0 px-4 py-0"
                  >
                    Create draft
                  </DecoratedButton>
                )}
              </div>
            )}

            {isInReview && (
              <Typography className="rounded-[10px] bg-grey-50 p-4 font-world text-[13px] leading-[130%] font-medium text-grey-700">
                This draft is in review, so its App URL is temporarily locked.
              </Typography>
            )}

            {needsResolution && (
              <Typography className="rounded-[10px] bg-system-warning-100 p-4 font-world text-[13px] leading-[130%] font-medium text-system-warning-600">
                Resolve the requested changes in Get Verified before editing
                this App URL.
              </Typography>
            )}
          </section>

          <section className="grid w-full gap-y-2">
            <MiniAppPreviewCard
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export const DevelopPage = (props: DevelopPageProps) => {
  const params = use(props.params);
  const appId = params.appId as `app_${string}`;
  const teamId = params.teamId as `team_${string}`;

  const { data, loading, error } = useQuery(FetchAppMetadataDocument, {
    variables: { id: appId },
  });
  const app = data?.app[0];

  if (!loading && (error || !app)) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  if (loading || !app) {
    return (
      <div className="pt-8 pb-12">
        <FormSkeleton count={4} />
      </div>
    );
  }

  const activeMetadata = app.app_metadata[0] ?? app.verified_app_metadata[0];

  return (
    <SaveStatusProvider>
      <DevelopContent
        key={activeMetadata?.id ?? appId}
        appId={appId}
        teamId={teamId}
        app={app}
      />
    </SaveStatusProvider>
  );
};
