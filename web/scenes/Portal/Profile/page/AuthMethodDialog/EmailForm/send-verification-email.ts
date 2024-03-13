"use server";

import { logger } from "@/lib/logger";
import { ManagementClient, Passwordless } from "auth0";

export const sendVerificationEmail = async (params: { email: string }) => {
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

  const { email } = params;

  const managementClient = new ManagementClient({
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    domain: process.env.AUTH0_DOMAIN,
  });

  const passwordless = new Passwordless({
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    domain: process.env.AUTH0_DOMAIN,
  });

  try {
    const res = await passwordless.sendEmail({
      email,
      send: "code",
    });
  } catch (error) {
    logger.error("Failed to send verification email", { error });
    throw new Error("Failed to send verification email");
  }

  return { success: true };
};
