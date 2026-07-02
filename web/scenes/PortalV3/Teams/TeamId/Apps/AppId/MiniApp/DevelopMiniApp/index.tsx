"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { ErrorPage } from "@/components/ErrorPage";
import { FloatingInput } from "@/components/FloatingInput";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { inferHttps } from "@/lib/schema";
import { useFetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { yupResolver } from "@hookform/resolvers/yup";
import { use, useMemo, useState } from "react";
import { useForm, UseFormRegisterReturn } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import * as yup from "yup";
import { QrQuickAction } from "../../Configuration/BasicInformation/QrQuickAction";
import { validateAndSubmitServerSide } from "../../Configuration/BasicInformation/server/submit";
import { MiniAppSubTabs } from "../SubTabs";

const schema = yup.object({
  integration_url: yup
    .string()
    .transform(inferHttps)
    .url("Must be a valid https:// URL")
    .matches(/^https:\/\//, { message: "Link must be a valid HTTPS URL" })
    .required("App URL is required"),
});

type FormValues = yup.Asserts<typeof schema>;

const isValidHttpsUrl = (value?: string | null): value is string =>
  Boolean(value && /^https:\/\/\S+/.test(value));

type DevelopMiniAppProps = {
  params: Promise<Record<string, string>>;
};

/**
 * "Develop" mini-app scene: a single App URL field and a preview QR code. The
 * QR only hydrates once a valid App URL has been saved (either previously or in
 * this session). No app icon / submit-for-review header, no mini-app-vs-external
 * switch, no app_mode gating — just a place to point at and test your mini app.
 */
export const DevelopMiniApp = ({ params }: DevelopMiniAppProps) => {
  const routeParams = use(params);
  const appId = routeParams?.appId as `app_${string}`;
  const teamId = routeParams?.teamId as `team_${string}`;

  const { data, loading, error, refetch } = useFetchAppMetadataQuery({
    variables: { id: appId },
  });

  const app = data?.app[0];
  const appMetadata = app?.app_metadata?.[0] ?? app?.verified_app_metadata?.[0];

  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    values: { integration_url: appMetadata?.integration_url ?? "" },
  });

  // The persisted App URL that gates the QR: prefer the value just saved in this
  // session, otherwise whatever is already stored on the app.
  const effectiveUrl = savedUrl ?? appMetadata?.integration_url ?? "";
  const isVerified = appMetadata?.verification_status === "verified";

  const miniAppUrl = useMemo(() => {
    let url = `https://world.org/mini-app?app_id=${appId}&path=`;
    if (!isVerified && appMetadata?.id) {
      url += `&draft_id=${appMetadata.id}`;
    }
    return url;
  }, [appId, isVerified, appMetadata?.id]);

  // Mirror BasicInformation's App URL field: infer `https://` on blur so a bare
  // domain becomes a valid URL before validation runs.
  const base = register("integration_url");
  const urlRegister: UseFormRegisterReturn = {
    ...base,
    onBlur: async (event) => {
      await base.onBlur(event);
      const value = (event.target as HTMLInputElement).value;
      const inferred = inferHttps(value);
      if (inferred !== value) {
        setValue("integration_url", inferred, { shouldValidate: true });
      }
    },
  };

  if (!loading && (error || !app || !appMetadata)) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!appMetadata) return;
    setIsSaving(true);
    try {
      const result = await validateAndSubmitServerSide(appMetadata.id, appId, {
        integration_url: values.integration_url,
      });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't save your App URL");
        return;
      }
      setSavedUrl(values.integration_url);
      await refetch();
      toast.success("App URL saved");
    } catch {
      toast.error("Couldn't save your App URL");
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <div className="py-10">
      <div className="md:hidden">
        <MiniAppSubTabs />
      </div>

      <div className="mx-auto grid max-w-[560px] gap-y-8 pt-4">
        <div className="grid gap-y-2 text-center">
          <Typography variant={TYPOGRAPHY.H6} className="font-normal">
            Develop your mini app
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Add your App URL, then scan the preview QR code to test your mini
            app inside World App.
          </Typography>
        </div>

        {loading ? (
          <Skeleton height={56} />
        ) : (
          <form onSubmit={onSubmit} className="grid gap-y-4">
            <FloatingInput
              id="integration_url"
              label="App URL"
              required
              errors={errors.integration_url}
              register={urlRegister}
            />
            <DecoratedButton
              type="submit"
              loading={isSaving}
              className="justify-self-start"
            >
              <Typography variant={TYPOGRAPHY.M3}>Save</Typography>
            </DecoratedButton>
          </form>
        )}

        {isValidHttpsUrl(effectiveUrl) && (
          <div className="flex justify-center">
            <QrQuickAction
              url={miniAppUrl}
              showDraftMiniAppFlag={!isVerified}
            />
          </div>
        )}
      </div>
    </div>
  );
};
