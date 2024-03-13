"use server";

import { logger } from "@/lib/logger";
import { Passwordless } from "auth0";

export const verifyEmailWithOTP = async (params: {
  email: string;
  otp: string;
}) => {
  if (
    !process.env.AUTH0_CLIENT_ID ||
    !process.env.AUTH0_CLIENT_SECRET ||
    !process.env.AUTH0_DOMAIN
  ) {
    logger.error(
      "Missing Auth0 environment variables. Impossible to send verification email.",
    );

    throw new Error("Missing Auth0 environment variables.");
  }

  const { email, otp } = params;

  const passwordless = new Passwordless({
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    domain: process.env.AUTH0_DOMAIN,
  });

  try {
    await passwordless.loginWithEmail({
      code: otp,
      email: email,
    });
  } catch (error) {
    logger.error("Failed to verify email with OTP", { error });
    throw new Error("Failed to verify email with OTP");
  }

  return { success: true };
};
