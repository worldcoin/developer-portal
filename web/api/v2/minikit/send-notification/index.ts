import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { fetchWithRetry } from "@/lib/utils";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { createHash } from "crypto";
import { GraphQLClient } from "graphql-request";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as fetchApiKeySdk } from "../graphql/fetch-api-key.generated";
import {
  CreateNotificationLogMutationVariables,
  getSdk as createNotificationLogSdk,
} from "./graphql/create-notification-log.generated";
import { getSdk as fetchMetadataSdk } from "./graphql/fetch-metadata.generated";
import {
  sendNotificationBodySchemaV1,
  sendNotificationBodySchemaV2,
} from "./schema";

type NotificationResult = {
  walletAddress: string;
  sent: boolean;
  reason?: string;
};

type SendNotificationResponse = {
  results: NotificationResult[];
};
type SendNotificationBodyV1 = yup.InferType<
  typeof sendNotificationBodySchemaV1
>;
type SendNotificationBodyV2 = yup.InferType<
  typeof sendNotificationBodySchemaV2
>;

export const logNotification = async (
  serviceClient: GraphQLClient,
  app_id: string,
  wallet_addresses: string[] | undefined,
  mini_app_path: string | undefined,
  message?: string | undefined,
) => {
  if (!wallet_addresses || !mini_app_path) {
    logger.warn(
      "NotificationLog - missing wallet_addresses or mini_app_path, skipping log",
      { app_id },
    );
    return;
  }

  // skip if few addresses because of privacy concerns
  if (wallet_addresses.length < 10) {
    return;
  }

  let notificationLog: CreateNotificationLogMutationVariables = {
    app_id,
    mini_app_path,
    message,
  };

  const { insert_notification_log_one } =
    await createNotificationLogSdk(serviceClient).CreateNotificationLog(
      notificationLog,
    );

  const notificationLogId = insert_notification_log_one?.id;

  if (!notificationLogId) {
    logger.error(
      "NotificationLog - failed to create notification log, skipping wallet address log",
      { app_id },
    );
    return;
  }

  createNotificationLogSdk(serviceClient).CreateWalletAdressNotificationLogs({
    objects: wallet_addresses.map((wallet_address) => ({
      wallet_address,
      notification_log_id: notificationLogId,
    })),
  });
};

const getSchemaVersion = (body: object) => {
  if ("localisations" in body) {
    return "v2";
  }
  if ("title" in body && "message" in body) {
    return "v1";
  }
  return null;
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

  const schemaVersion = getSchemaVersion(body);
  if (schemaVersion === null) {
    return errorResponse({
      statusCode: 400,
      code: "validation_error",
      detail: "Neither localisations nor title and message are specified",
      attribute: "request_body",
      req,
    });
  }

  const schema =
    schemaVersion === "v1"
      ? sendNotificationBodySchemaV1
      : sendNotificationBodySchemaV2;

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
    app_id: body?.app_id,
  });

  if (!isValid) {
    return handleError(req);
  }

  const { app_id, wallet_addresses, mini_app_path } = {
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

  const redis = global.RedisClient;

  if (!redis) {
    return errorResponse({
      statusCode: 500,
      code: "internal_server_error",
      detail: "Redis client not found",
      attribute: "server",
      req,
      app_id,
    });
  }

  if (!api_key_by_pk) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "API key not found.",
      attribute: "api_key",
      req,
      app_id,
    });
  }

  if (!api_key_by_pk.is_active) {
    return errorResponse({
      statusCode: 400,
      code: "api_key_inactive",
      detail: "API key is inactive.",
      attribute: "api_key",
      req,
      app_id,
    });
  }

  if (!api_key_by_pk.team.apps.some((a) => a.id === app_id)) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_app",
      detail: "API key is not valid for this app.",
      attribute: "api_key",
      req,
      app_id,
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
      app_id,
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
      code: "app_not_found",
      detail: "App not found",
      attribute: "app",
      req,
      app_id,
    });
  }
  // If app is verified we pull that app metadata
  let verifiedOrDefaultApp = app_metadata[0];
  if (app_metadata.length > 1) {
    const verifiedApp = app_metadata.find(
      (app) => app.verification_status === "verified",
    );
    if (verifiedApp) {
      verifiedOrDefaultApp = verifiedApp;
    } else {
      return errorResponse({
        statusCode: 400,
        code: "duplicate_app",
        detail: "Invalid app configuration",
        attribute: "app",
        req,
        app_id,
      });
    }
  }

  const appMetadata = app_metadata?.[0];
  const teamId = appMetadata.app.team.id;

  // If app is not verified we allow max 40 notifications per 4 hours
  if (verifiedOrDefaultApp?.verification_status !== "verified") {
    const key = `app_notifications_${app_id}`;
    const TTL_SECONDS = 14400; // 4 hours in seconds

    let currentCount = await redis.get(key);
    const parsedCount = currentCount ? Number(currentCount) : 0;
    const notificationsToAdd = wallet_addresses.length;

    // Check if adding these notifications would exceed the limit:
    if (parsedCount + notificationsToAdd > 40) {
      return errorResponse({
        statusCode: 400,
        code: "unverified_app_limit_reached",
        detail: "Unverified app limit reached",
        attribute: "notifications",
        req,
        app_id,
        team_id: teamId,
      });
    }

    // If the counter doesn't exist yet, initialize with TTL.
    if (!currentCount) {
      await redis.set(key, notificationsToAdd, "EX", TTL_SECONDS);
    } else {
      const timeLeft = await redis.ttl(key);
      const newCount = parsedCount + notificationsToAdd;

      // Update the count
      await redis.set(
        key,
        newCount,
        "EX",
        timeLeft > 0 ? timeLeft : TTL_SECONDS,
      );
    }
  }

  // notifications are allowed and not paused
  const areNotificationsEnabled =
    appMetadata.is_allowed_unlimited_notifications ||
    appMetadata.max_notifications_per_day !== 0;

  if (!areNotificationsEnabled) {
    return errorResponse({
      statusCode: 400,
      code: "not_allowed",
      detail: "Notifications not enabled for this app",
      req,
      app_id,
      team_id: teamId,
    });
  }

  const areNotificationsPaused =
    appMetadata.notification_permission_status === "paused";
  if (areNotificationsPaused) {
    return errorResponse({
      statusCode: 400,
      code: "paused",
      detail: `Notifications are paused for this app. 
      Your app had average open rate below 10% which resulted in a 7day pause. 
      Pause started at ${appMetadata.notification_permission_status_changed_date}`,
      req,
      app_id,
      team_id: teamId,
    });
  }

  // Anchor: Send notification
  const internalSendNotificationRequestBody =
    schemaVersion === "v1"
      ? {
          appId: app_id,
          walletAddresses: wallet_addresses,
          title: (parsedParams as SendNotificationBodyV1).title!,
          message: (parsedParams as SendNotificationBodyV1).message!,
          miniAppPath: mini_app_path,
          teamId: teamId,
        }
      : {
          appId: app_id,
          walletAddresses: wallet_addresses,
          miniAppPath: mini_app_path,
          teamId: teamId,
          localisations: (parsedParams as SendNotificationBodyV2).localisations,
        };

  const signedFetch = createSignedFetcher({
    service: "execute-api",
    region: process.env.TRANSACTION_BACKEND_REGION,
  });

  let res: Response;

  const sortedWalletAddresses = wallet_addresses.sort();
  const idempotencyKey = createHash("sha256")
    .update(`${app_id}:${sortedWalletAddresses.join(",")}`)
    .digest("hex");

  try {
    res = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_SEND_NOTIFICATION_ENDPOINT}`,
      {
        method: "POST",
        headers: {
          "User-Agent": req.headers.get("user-agent") ?? "DevPortal/1.0",
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(internalSendNotificationRequestBody),
      },
      10, // max retries
      300, // initial retry delay in ms
      5000, // fetch timeout in ms
      false, // throw on error
      signedFetch,
    );
  } catch (error) {
    logger.error("Error sending notification", {
      error: error,
      app_id,
      team_id: teamId,
    });
    return errorResponse({
      statusCode: 500,
      code: "internal_server_error",
      detail: "Server error occurred",
      attribute: "notification",
      req,
      app_id,
      team_id: teamId,
    });
  }

  let data: any = {};

  try {
    data = await res.json();
  } catch (e) {
    logger.warn("Error parsing send notification response body", {
      error: e,
    });
  }

  if (!res.ok) {
    logger.warn("Error sending notification", {
      data,
      app_id,
      team_id: teamId,
    });

    let errorMessage;
    if (data && data.error) {
      errorMessage = data.error.message;
    } else {
      errorMessage = "Server error occurred";
    }

    return errorResponse({
      statusCode: res.status === 429 ? 500 : res.status, // If we get a 429 from the backend, we return a 500 to the client
      code: data.error.code ?? "internal_server_error",
      detail: errorMessage,
      attribute: "notification",
      req,
      app_id,
      team_id: teamId,
    });
  }
  const response: SendNotificationResponse = data.result;
  if (schemaVersion === "v1") {
    logNotification(
      serviceClient,
      app_id,
      wallet_addresses,
      mini_app_path,
      (parsedParams as SendNotificationBodyV1).message,
    );
  } else if (schemaVersion === "v2") {
    const localisations = (parsedParams as SendNotificationBodyV2)
      .localisations;

    for (const localisation of localisations) {
      logNotification(
        serviceClient,
        app_id,
        wallet_addresses,
        mini_app_path,
        localisation.message,
      );
    }
  }

  return NextResponse.json({
    success: true,
    status: 200,
    result: response.results,
  });
};
