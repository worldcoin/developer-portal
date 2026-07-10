"use client";

import { AppStatus, StatusVariant } from "@/components/AppStatus";
import { DecoratedButton } from "@/components/DecoratedButton";
import { ErrorPage } from "@/components/ErrorPage";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import { useFetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useSetAtom } from "jotai";
import { useParams, useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import { useCreateNewDraft } from "../hook/use-create-new-draft";
import { viewModeAtom } from "../layout/ImagesProvider";

type AppVersionsPageProps = {
  params: Record<string, string> | null | undefined;
};

type VersionRow = {
  label: string;
  name: string;
  status: StatusVariant;
  verifiedAt?: string | null;
  reviewMessage?: string | null;
  mode: "verified" | "unverified";
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));

const VersionsTable = ({
  versions,
  onOpen,
}: {
  versions: VersionRow[];
  onOpen: (mode: VersionRow["mode"]) => void;
}) => {
  const columns = ["App name", "Verified at", "Status", "Review message"];

  return (
    <div className="no-scrollbar overflow-x-auto rounded-xl border border-grey-200 bg-grey-0">
      <table
        aria-label="App versions"
        className="w-full min-w-[800px] table-fixed text-left"
      >
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
          <col className="w-[30%]" />
        </colgroup>
        <thead className="border-b border-grey-200 bg-grey-50/70 text-grey-500">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="h-11 px-5 font-normal">
                <Typography variant={TYPOGRAPHY.R5}>{column}</Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-grey-200">
          {versions.map((version) => {
            return (
              <tr
                key={version.mode}
                className="transition-colors hover:bg-grey-25"
              >
                <td className="px-5 py-4 align-middle">
                  <button
                    type="button"
                    onClick={() => onOpen(version.mode)}
                    aria-label={`Open ${version.label}`}
                    className="grid text-left"
                  >
                    <Typography
                      variant={TYPOGRAPHY.M4}
                      className="text-grey-900 hover:underline"
                    >
                      {version.name}
                    </Typography>
                    <Typography
                      variant={TYPOGRAPHY.R5}
                      className="mt-1 text-grey-500"
                    >
                      {version.label}
                    </Typography>
                  </button>
                </td>
                <td className="px-5 py-4 align-middle">
                  <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
                    {version.status === "verified" && version.verifiedAt
                      ? formatDate(version.verifiedAt)
                      : "N/A"}
                  </Typography>
                </td>
                <td className="px-5 py-4 align-middle">
                  <AppStatus
                    status={version.status}
                    className="w-fit"
                    typography={TYPOGRAPHY.R5}
                  />
                </td>
                <td className="px-5 py-4 align-middle">
                  <Typography
                    variant={TYPOGRAPHY.R4}
                    className="text-grey-600 line-clamp-2"
                  >
                    {version.reviewMessage?.trim() || "—"}
                  </Typography>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const AppVersionsPage = ({ params }: AppVersionsPageProps) => {
  const routeParams = useParams<{ appId: `app_${string}`; teamId: string }>();
  const appId = (params?.appId || routeParams?.appId) as `app_${string}`;
  const teamId = (params?.teamId || routeParams?.teamId) as `team_${string}`;
  const router = useRouter();
  const { user } = useUser() as Auth0SessionUser;
  const setViewMode = useSetAtom(viewModeAtom);

  const { data, loading, error } = useFetchAppMetadataQuery({
    variables: { id: appId },
  });

  const app = data?.app[0];
  const draftMetadata = app?.app_metadata?.[0];
  const verifiedMetadata = app?.verified_app_metadata?.[0];

  const verified: VersionRow | undefined = verifiedMetadata
    ? {
        label: "Approved version",
        name: verifiedMetadata.name,
        status: "verified",
        verifiedAt: verifiedMetadata.verified_at,
        reviewMessage: verifiedMetadata.review_message,
        mode: "verified",
      }
    : undefined;

  const draft: VersionRow | undefined = draftMetadata
    ? {
        label: "Current update",
        name: draftMetadata.name,
        status: draftMetadata.verification_status as StatusVariant,
        reviewMessage: draftMetadata.review_message,
        mode: "unverified",
      }
    : undefined;

  const canManage = checkUserPermissions(user, teamId, [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);
  const { createNewDraft, isCreating } = useCreateNewDraft({
    appId,
    teamId,
    hasDraft: Boolean(draft),
    hasVerifiedVersion: Boolean(verified),
  });
  const configurationHref = urls.configuration({
    team_id: teamId,
    app_id: appId,
  });

  const openVersion = (mode: VersionRow["mode"]) => {
    setViewMode(mode);
    router.push(configurationHref);
  };

  const handleCreateDraft = async () => {
    if (await createNewDraft()) {
      router.push(configurationHref);
    }
  };

  if (loading) {
    return (
      <SizingWrapper variant="nav" gridClassName="order-1 py-12">
        <div className="mx-auto max-w-5xl">
          <Skeleton count={3} height={52} />
        </div>
      </SizingWrapper>
    );
  }

  if (error || !app || (!verified && !draft)) {
    return (
      <SizingWrapper variant="nav" gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="App not found" />
      </SizingWrapper>
    );
  }

  const canCreateDraft = Boolean(verified && !draft && canManage);
  const versions = [draft, verified].filter((version): version is VersionRow =>
    Boolean(version),
  );

  return (
    <SizingWrapper variant="nav" gridClassName="order-1">
      <main className="mx-auto w-full max-w-5xl py-12">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-y-2">
            <Typography
              as="h1"
              variant={TYPOGRAPHY.H5}
              className="text-grey-900"
            >
              Versions
            </Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Manage the approved app and its next update.
            </Typography>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(configurationHref)}
              className="hover:bg-grey-800 h-11 rounded-lg bg-grey-900 px-4 text-white transition-colors"
            >
              <Typography variant={TYPOGRAPHY.M4}>Configuration</Typography>
            </button>
            {canCreateDraft && (
              <DecoratedButton
                type="button"
                icon={<PlusIcon className="size-5" />}
                loading={isCreating}
                onClick={handleCreateDraft}
                className="h-11 px-5 py-2.5"
              >
                <Typography variant={TYPOGRAPHY.M4}>
                  Create new draft
                </Typography>
              </DecoratedButton>
            )}
          </div>
        </header>

        <section className="mt-12">
          <VersionsTable versions={versions} onOpen={openVersion} />
        </section>

        {verified && !draft && !canManage && (
          <Typography variant={TYPOGRAPHY.R4} className="mt-5 text-grey-500">
            An owner or admin can create the next draft.
          </Typography>
        )}
      </main>
    </SizingWrapper>
  );
};
