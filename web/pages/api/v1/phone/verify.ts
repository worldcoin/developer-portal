import { NextApiRequest, NextApiResponse } from "next";
import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "errors";
import { ActionType } from "types";
import twilio from "twilio";
import { hashPhoneNumber, reportAPIEventToPostHog } from "api-utils";
import crypto from "crypto";
import { exit } from "process";
import { ethers } from "ethers";

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

/**
 * Verifies a phone number OTP and issues nullifier
 * WARNING: This is an ALPHA feature. Not ready for widespread use. Phone credentials will eventually move to self-custodial wallet.
 * @param req
 * @param res
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  if (!process.env.TWILIO_VERIFY_SERVICE) {
    throw new Error(
      'Improperly configured. Missing "TWILIO_VERIFY_SERVICE" env var.'
    );
  }

  if (!process.env.PHONE_NULLIFIER_SIGNING_KEY) {
    throw new Error(
      'Improperly configured. Missing "PHONE_NULLIFIER_SIGNING_KEY" env var.'
    );
  }

  const { phone_number, action_id, code, ph_distinct_id } = req.body as Record<
    string,
    string
  >;

  if (!phone_number) {
    return errorRequiredAttribute("phoneNumber", res);
  }

  if (!action_id) {
    return errorRequiredAttribute("action_id", res);
  }

  if (!code) {
    return errorRequiredAttribute("code", res);
  }

  if (!phone_number.match(E_164_REGEX)) {
    return errorValidation(
      "invalid_phone_number",
      "Invalid phone number. Please use E.164 format.",
      "phone_number",
      res
    );
  }

  // ANCHOR: Check action ID
  // NOTE: Phone verification does not offer uniqueness check on Dev Portal (apps should implement their own logic). To ensure privacy, we don't store nullifiers.
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

  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  const { channel, status } = await twilioClient.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE)
    .verificationChecks.create({ to: phone_number, code });

  if (status === "approved") {
    const nullifier_hash = await hashPhoneNumber(phone_number, action_id);

    await reportAPIEventToPostHog(
      "phone verification verified",
      ph_distinct_id,
      {
        action_id,
        channel,
        is_staging,
      }
    );

    const timestamp = new Date().getTime();

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ timestamp, nullifier_hash }))
      .digest("hex");

    const signingKey = new ethers.utils.SigningKey(
      process.env.PHONE_NULLIFIER_SIGNING_KEY
    );

    const signature = signingKey.signDigest(`0x${hash}`).compact;

    // FIXME: Insert nullifier into DB

    return res.status(200).json({
      success: true,
      nullifier_hash,
      timestamp,
      signature,
      public_key: signingKey.publicKey,
    });
  } else {
    return errorResponse(
      res,
      400,
      "invalid_code",
      "Invalid code. Please try again.",
      "code"
    );
  }
}
