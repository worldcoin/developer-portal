import { generateAppImagePresignedPost } from "@/api/helpers/app-image-storage";
import { getSdk as checkAppInTeamDocumentSDK } from "@/api/hasura/graphql/checkAppInTeam.generated";
import { getSdk as checkUserInAppDocumentSDK } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const schema = yup
  .object({
    app_id: yup.string().strict().required(),
    image_type: yup.string().strict().required(),
    content_type_ending: yup.string().required(),
    locale: yup.string(),
  })
  .noUnknown();

export const POST = async (req: NextRequest) => {
  let app_id: string | undefined;
  let team_id: string | undefined;

  try {
    const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
    if (!isAuthenticated) {
      return errorResponse;
    }

    const body = await req.json();
    if (body?.action.name !== "upload_image") {
      return errorHasuraQuery({
        req,
        detail: "Invalid action.",
        code: "invalid_action",
      });
    }

    const sessionVariables = body.session_variables ?? {};
    const role = sessionVariables["x-hasura-role"];
    const userId = sessionVariables["x-hasura-user-id"];
    const sessionTeamId = sessionVariables["x-hasura-team-id"];

    team_id = body.input.team_id;

    if (!team_id) {
      return errorHasuraQuery({
        req,
        detail: "team_id must be set.",
        code: "required",
      });
    }

    const { isValid, parsedParams } = await validateRequestSchema({
      value: Object.fromEntries(req.nextUrl.searchParams),
      schema,
    });

    if (!isValid || !parsedParams) {
      return errorHasuraQuery({
        req,
        detail: "Invalid request params.",
        code: "invalid_request",
        team_id,
      });
    }

    const { image_type, content_type_ending, locale } = parsedParams;
    app_id = parsedParams.app_id;
    const uploadAppId = app_id;
    const uploadTeamId = team_id;

    if (!["png", "jpeg"].includes(content_type_ending)) {
      return errorHasuraQuery({
        req,
        detail: "Content Type is invalid",
        code: "invalid_input",
        app_id,
        team_id,
      });
    }
    const client = await getAPIServiceGraphqlClient();

    const getUploadableApp = async () => {
      const { app } = await checkAppInTeamDocumentSDK(client).CheckAppInTeam({
        team_id: uploadTeamId,
        app_id: uploadAppId,
      });

      return app.find((currentApp) => currentApp.app_metadata.length > 0);
    };

    // This action is exposed to both dashboard users and Dev Portal API keys.
    if (role === "api_key") {
      if (sessionTeamId !== team_id) {
        return errorHasuraQuery({
          req,
          detail: "App not found.",
          code: "not_found",
          app_id,
          team_id,
        });
      }

      if (!(await getUploadableApp())) {
        return errorHasuraQuery({
          req,
          detail: "App not found.",
          code: "not_found",
          app_id,
          team_id,
        });
      }
    } else {
      if (!userId) {
        return errorHasuraQuery({
          req,
          detail: "user_id must be set.",
          code: "required",
          app_id,
          team_id,
        });
      }

      const { team: userTeam } = await checkUserInAppDocumentSDK(
        client,
      ).CheckUserInApp({
        team_id,
        app_id,
        user_id: userId,
      });

      // Admins and Owners allowed to upload images
      if (userTeam.length === 0) {
        return errorHasuraQuery({
          req,
          detail: "App not found.",
          code: "not_found",
          app_id,
          team_id,
        });
      }

      if (!(await getUploadableApp())) {
        return errorHasuraQuery({
          req,
          detail: "App not found.",
          code: "not_found",
          app_id,
          team_id,
        });
      }
    }

    const { url, fields } = await generateAppImagePresignedPost({
      appId: app_id,
      imageType: image_type,
      contentTypeEnding: content_type_ending,
      locale,
    });

    return NextResponse.json({
      url,
      stringifiedFields: JSON.stringify(fields),
    });
  } catch (error) {
    logger.error("Error uploading image.", { error, app_id, team_id });

    return errorHasuraQuery({
      req,
      detail: "Unable to upload image",
      code: "internal_error",
      app_id,
      team_id,
    });
  }
};
