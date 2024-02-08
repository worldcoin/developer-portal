"use client";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../../graphql/client/fetch-app-metadata.generated";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useEffect, useMemo } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { Role_Enum } from "@/graphql/graphql";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useUpdateAppLinksInfoMutation } from "./graphql/client/update-app-links.generated";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Input } from "@/components/Input";

const schema = yup.object().shape({
  integration_url: yup
    .string()
    .url("Must be a valid URL")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "Link must be a valid HTTPS URL",
      excludeEmptyString: true,
    })
    .required("This field is required"),
  app_website_url: yup
    .string()
    .url("Must be a valid URL")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "Link must be a valid HTTPS URL",
      excludeEmptyString: true,
    })
    .optional(),
  source_code_url: yup
    .string()
    .url("Must be a valid URL")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "Link must be a valid HTTPS URL",
      excludeEmptyString: true,
    })
    .optional(),
});

type LinksFormValues = yup.Asserts<typeof schema>;

type LinksFormProps = {
  appId: string;
  teamId: string;
  app?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
};

export const LinksForm = (props: LinksFormProps) => {
  const { appId, teamId, app } = props;
  const { user } = useUser() as Auth0SessionUser;
  const [updateLinksMutation, { loading: updatingInfo }] =
    useUpdateAppLinksInfoMutation();
  const isEditable = app?.verification_status === "unverified";

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === teamId,
    );
    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [teamId, user?.hasura.memberships]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<LinksFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      integration_url: app?.integration_url,
      app_website_url: app?.app_website_url,
      source_code_url: app?.source_code_url,
    },
  });

  useEffect(() => {
    reset({
      integration_url: app?.integration_url,
      app_website_url: app?.app_website_url,
      source_code_url: app?.source_code_url,
    });
  }, [app, reset]);

  const submit = useCallback(
    async (values: LinksFormValues) => {
      if (updatingInfo) return;
      try {
        const result = await updateLinksMutation({
          variables: {
            app_metadata_id: app?.id ?? "",
            integration_url: values.integration_url,
            app_website_url: values.app_website_url ?? "",
            source_code_url: values.source_code_url ?? "",
          },
          context: { headers: { team_id: teamId } },
          refetchQueries: [
            {
              query: FetchAppMetadataDocument,
              variables: {
                id: appId,
              },
              context: { headers: { team_id: teamId } },
            },
          ],
        });
        if (result instanceof Error) {
          throw result;
        }
        toast.success("App information updated successfully");
      } catch (e) {
        console.error(e);
        toast.error("Failed to update app information");
      }
    },
    [app?.id, appId, teamId, updateLinksMutation, updatingInfo],
  );

  return (
    <form className="grid gap-y-7" onSubmit={handleSubmit(submit)}>
      <Typography variant={TYPOGRAPHY.H7}>Links</Typography>

      <div className="grid gap-y-5">
        <Input
          label="Try it out"
          required
          errors={errors.integration_url}
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="https://"
          register={register("integration_url")}
        />
        <Input
          label="Official website"
          errors={errors.app_website_url}
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="https://"
          register={register("app_website_url")}
        />
        <Input
          label="Github"
          errors={errors.source_code_url}
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="https://"
          register={register("source_code_url")}
        />
      </div>

      <DecoratedButton
        type="submit"
        className="w-40 h-12"
        disabled={!isEditable || !isEnoughPermissions || !isDirty || !isValid}
      >
        <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
      </DecoratedButton>
    </form>
  );
};
