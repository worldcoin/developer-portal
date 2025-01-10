import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { notificationPermissions } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { GraphQLClient } from "graphql-request";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as fetchApiKeySdk } from "../graphql/fetch-api-key.generated";
import {
  CreateNotificationLogMutationVariables,
  getSdk as createNotificationLogSdk,
} from "./graphql/create-notification-log.generated";
import { getSdk as fetchMetadataSdk } from "./graphql/fetch-metadata.generated";

const sendNotificationBodySchema = yup.object({
  app_id: yup.string().strict().required(),
  wallet_addresses: yup
    .array()
    .of(yup.string())
    .min(1)
    .max(1000)
    .required("wallet_addresses is required"),
  message: yup.string().strict().required().max(200),
  title: yup.string().strict().optional().max(30),
  mini_app_path: yup.string().strict().required(),
});

type NotificationResult = {
  walletAddress: string;
  sent: boolean;
  reason?: string;
};

type SendNotificationResponse = {
  results: NotificationResult[];
};

export const logNotification = async (
  serviceClient: GraphQLClient,
  app_id: string,
  wallet_addresses: (string | undefined)[] | undefined,
  mini_app_path: string | undefined,
  message?: string | undefined,
) => {
  if (!wallet_addresses || !mini_app_path) {
    logger.warn(
      "NotificationLog - missing wallet_addresses or mini_app_path, skipping log",
    );
    return;
  }

  const walletAddresses = wallet_addresses?.filter((w) => w) as string[];

  let notificationLog: CreateNotificationLogMutationVariables = {
    app_id,
    mini_app_path,
  };

  // Log notifications sent to more than 10 addresses
  if (walletAddresses.length > 10) {
    notificationLog.message = message;
  }

  const { insert_notification_log_one } =
    await createNotificationLogSdk(serviceClient).CreateNotificationLog(
      notificationLog,
    );

  const notificationLogId = insert_notification_log_one?.id;

  if (!notificationLogId) {
    logger.error(
      "NotificationLog - failed to create notification log, skipping wallet address log",
    );
    return;
  }

  createNotificationLogSdk(serviceClient).CreateWalletAdressNotificationLogs({
    objects: walletAddresses.map((wallet_address) => ({
      wallet_address,
      notification_log_id: notificationLogId,
    })),
  });

  logger.info(`Notification sent successfully, ${app_id}`);
};

export const POST = async (req: NextRequest) => {
  const api_key = req.headers.get("authorization")?.split(" ")[1];

  if (
    !process.env.NEXT_PUBLIC_APP_ENV ||
    !["dev", "staging", "production"].includes(process.env.NEXT_PUBLIC_APP_ENV)
  ) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "Invalid Environment Configuration",
      attribute: "app_env",
      req,
    });
  }

  if (!api_key) {
    return errorResponse({
      statusCode: 401,
      code: "unauthorized",
      detail: "API key is required.",
      attribute: "api_key",
      req,
    });
  }
  const body = await req.json();

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema: sendNotificationBodySchema,
    value: body,
  });

  if (!isValid) {
    return handleError(req);
  }

  const { app_id, wallet_addresses, title, message, mini_app_path } = {
    ...parsedParams,
  };

  const keyValue = api_key.replace(/^api_/, "");
  const serviceClient = await getAPIServiceGraphqlClient();

  const base64ApiKey = Buffer.from(keyValue, "base64").toString("utf8");
  const [id, secret] = base64ApiKey.split(":");

  const { api_key_by_pk } = await fetchApiKeySdk(serviceClient).FetchAPIKey({
    id,
    appId: app_id,
  });

  if (!api_key_by_pk) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "API key not found.",
      attribute: "api_key",
      req,
    });
  }

  if (!api_key_by_pk.is_active) {
    return errorResponse({
      statusCode: 400,
      code: "api_key_inactive",
      detail: "API key is inactive.",
      attribute: "api_key",
      req,
    });
  }

  if (!api_key_by_pk.team.apps.some((a) => a.id === app_id)) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_app",
      detail: "API key is not valid for this app.",
      attribute: "api_key",
      req,
    });
  }

  const isAPIKeyValid = verifyHashedSecret(
    api_key_by_pk.id,
    secret,
    api_key_by_pk.api_key,
  );

  if (!isAPIKeyValid) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_api_key",
      detail: "API key is not valid.",
      attribute: "api_key",
      req,
    });
  }

  // Anchor: Check Permissions
  const { app_metadata } = await fetchMetadataSdk(serviceClient).GetAppMetadata(
    {
      app_id,
    },
  );

  if (!app_metadata || app_metadata.length === 0) {
    return errorResponse({
      statusCode: 404,
      code: "app_not_verified",
      detail: "App either doesn't exist or isn't verified",
      attribute: "app",
      req,
    });
  }

  const appMetadata = app_metadata?.[0];
  const teamId = appMetadata.app.team.id;

  // TODO: Remove this enforcement
  if (
    !notificationPermissions[
      process.env.NEXT_PUBLIC_APP_ENV as "staging" | "production"
    ].includes(teamId)
  ) {
    return errorResponse({
      statusCode: 403,
      code: "forbidden",
      detail: "You are not allowed to send notifications.",
      attribute: "team_id",
      req,
    });
  }

  // Anchor: Send notification

  const signedFetch = createSignedFetcher({
    service: "execute-api",
    region: process.env.TRANSACTION_BACKEND_REGION,
  });

  const res = await signedFetch(
    `${process.env.NEXT_PUBLIC_SEND_NOTIFICATION_ENDPOINT}`,
    {
      method: "POST",
      headers: {
        "User-Agent": req.headers.get("user-agent") ?? "DevPortal/1.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appId: app_id,
        walletAddresses: wallet_addresses,
        title,
        message,
        miniAppPath: mini_app_path,
        teamId: teamId,
      }),
    },
  );
  const data = await res.json();

  if (!res.ok) {
    console.warn("Error sending notification", data);

    let errorMessage;
    if (data && data.error) {
      errorMessage = data.error.message;
    } else {
      errorMessage = "Server Error Occurred";
    }

    return errorResponse({
      statusCode: res.status,
      code: data.error.code ?? "internal_api_error",
      detail: errorMessage,
      attribute: "notification",
      req,
    });
  }
  const response: SendNotificationResponse = data.result;
  logger.warn("Notification sent successfully", response);

  logNotification(
    serviceClient,
    app_id,
    wallet_addresses,
    mini_app_path,
    message,
  );

  return NextResponse.json({
    success: true,
    status: 200,
    result: response.results,
  });
};
