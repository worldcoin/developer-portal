import { NextApiRequest, NextApiResponse } from "next";
import { gql } from "@apollo/client";
import {
  getAPIServiceClient,
  getWLDAppBackendServiceClient,
} from "api-graphql";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "errors";
import { ActionType } from "types";
import twilio from "twilio";
import { hashPhoneNumber, reportAPIEventToPostHog } from "api-utils";
import requestIp from "request-ip";

const E_164_REGEX = /^\+[1-9]\d{10,14}$/;

interface ActionsQueryInterface {
  action: Pick<ActionType, "id" | "is_staging">[];
}

interface CheckPhoneQueryInterface {
  user: {
    publicKeyId: string;
    phoneNumber: string;
    isPushNotificationsEnabled: boolean;
  }[];
}

// TODO: This endpoint needs e2e functional testing

/**
 * Initiates the phone verification request
 * WARNING: This is an ALPHA feature. Not ready for widespread use. Phone credentials will eventually move to self-custodial wallet.
 * @param req
 * @param res
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ANCHOR: Validate client request
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  if (!process.env.TWILIO_VERIFY_SERVICE) {
    throw new Error(
      'Improperly configured. Missing "TWILIO_VERIFY_SERVICE" env var.'
    );
  }

  const { phone_number, action_id, channel, ph_distinct_id } =
    req.body as Record<string, string>;

  if (!phone_number) {
    return errorRequiredAttribute("phoneNumber", res);
  }

  if (!action_id) {
    return errorRequiredAttribute("action_id", res);
  }

  if (!phone_number.match(E_164_REGEX)) {
    return errorValidation(
      "invalid_phone_number",
      "Invalid phone number. Please use E.164 format.",
      "phone_number",
      res
    );
  }

  if (channel && channel !== "sms" && channel !== "call") {
    return errorValidation(
      "invalid_channel",
      "Invalid channel. Please use 'sms' or 'call'.",
      "channel",
      res
    );
  }

  // ANCHOR: Check action ID
  const localClient = await getAPIServiceClient();
  const {
    data: { action: actionList },
  } = await localClient.query<ActionsQueryInterface>({
    query: gql`
      query GetAction($action_id: String!) {
        action(
          where: {
            id: { _eq: $action_id }
            status: { _eq: "active" }
            tmp_phone_signal_whitelist: { _eq: true }
          }
          limit: 1
        ) {
          id
          is_staging
        }
      }
    `,
    variables: {
      action_id,
    },
  });

  if (actionList.length === 0) {
    return errorResponse(
      res,
      404,
      "not_found",
      "We couldn't find an action with this ID. Action may be no longer active or not whitelisted for this alpha feature."
    );
  }

  const { is_staging } = actionList[0];

  console.info(`Starting phone verification request for action: ${action_id}.`);

  // Check if phone was linked to a WLD account
  const wldAppClient = await getWLDAppBackendServiceClient(is_staging);
  const {
    data: { user: wldUsers },
  } = await wldAppClient.query<CheckPhoneQueryInterface>({
    query: gql`
      query CheckPhone($phone_number: String!) {
        user(where: { phoneNumber: { _eq: $phone_number } }) {
          publicKeyId
          phoneNumber
          isPushNotificationsEnabled
        }
      }
    `,
    variables: {
      phone_number,
    },
  });

  const hashedPhoneNumber = await hashPhoneNumber(phone_number, action_id);
  const hashedIpAddress = await hashPhoneNumber(
    requestIp.getClientIp(req) ?? "invalid_ip",
    "ipAddr"
  );

  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  let is_registered_in_app = false;

  if (wldUsers.length) {
    is_registered_in_app = true;
    console.info(`User is registered in Worldcoin app with linked number.`);
    // TODO: Send push notification to user
    // TODO: Send special SMS to user instead with deeplink, and option to reply and receive OTP
  }

  console.info(`User is not registered in Worldcoin app. Sending OTP SMS.`);
  let errorCode = null as number | null;
  let attempts_count = undefined as number | undefined;
  let carrier_type = undefined as string | undefined; // voip, landline, mobile, etc.
  let mobile_country_code = undefined as string | undefined;

  try {
    const { sendCodeAttempts, lookup } = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE)
      .verifications.create({
        to: phone_number,
        channel: channel || "sms",
        rateLimits: {
          rate_limit_phone_number: hashedPhoneNumber, // TODO: Ensure Twilio does not store this for extra privacy
          rate_limit_ip_address: hashedIpAddress,
        },
      });
    attempts_count = sendCodeAttempts.length;
    carrier_type = lookup?.carrier?.type;
    mobile_country_code = lookup?.carrier?.mobile_country_code;
  } catch (e) {
    errorCode = (e as Record<string, any>).code;
    if (errorCode === 60605) {
      console.warn("Blocked Twilio verify attempt for blocked country.");
      // NOTE: We deliberately do not send a detailed response to the client to avoid leaking information about blocked countries.
      return errorResponse(
        res,
        500,
        "server_error",
        "Verification could not be completed."
      );
    } else if (errorCode === 60203) {
      return errorResponse(
        res,
        429,
        "max_attempts",
        "Maximum attempts reached for this phone number. Please try again in 10 minutes."
      );
    } else if (errorCode === 20429) {
      return errorResponse(
        res,
        429,
        "timeout",
        "Please wait 1 minute before requesting another code."
      );
    } else {
      console.error("Twilio verification failed. Error:", e);
      return errorResponse(
        res,
        500,
        "server_error",
        "Verification could not be completed."
      );
    }
  }

  await reportAPIEventToPostHog("phone verification request", ph_distinct_id, {
    action_id,
    carrier_type,
    attempts_count,
    mobile_country_code,
    error_code: errorCode,
    success: !errorCode,
    is_registered_in_app: false,
    is_staging,
    channel,
  });

  res.status(204).end();
}
