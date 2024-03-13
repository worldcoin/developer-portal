import { ManagementClient, PostIdentitiesRequestProviderEnum } from "auth0";

/**
 * Links two user accounts in Auth0 based on their email and Auth0 ID.
 * @param params - The parameters for linking the accounts.
 * @param params.email - The email of the user.
 * @param params.auth0Id - The Auth0 ID of the user.
 * @param params.nullifierHash - The nullifier hash of the user.
 * @throws {Error} If any of the required Auth0 environment variables are missing.
 * @throws {Error} If the number of users found is not equal to 2.
 * @throws {Error} If the primary or secondary user is not found.
 * @returns {Promise<void>} A promise that resolves when the accounts are linked.
 */
export const linkAccounts = async (params: {
  email: string;
  auth0Id: string;
  nullifierHash: string;
}) => {
  if (
    !process.env.AUTH0_CLIENT_ID ||
    !process.env.AUTH0_CLIENT_SECRET ||
    !process.env.AUTH0_DOMAIN
  ) {
    throw new Error(
      "Missing Auth0 environment variables. Impossible to link accounts.",
    );
  }

  const { email, auth0Id, nullifierHash } = params;

  const managementClient = new ManagementClient({
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    domain: process.env.AUTH0_DOMAIN,
  });

  const users = await managementClient.users.getAll({
    q: `email:"${email}" OR user_id:"oauth2|worldcoin|${nullifierHash}"`,
    search_engine: "v3",
  });

  // NOTE: After a linking secondary account will be removed. So we will get only 1 user after linking and stop here.
  if (users.data.length !== 2) {
    throw new Error(
      `Expected 2 users to link accounts, but found ${users.data.length}.`,
    );
  }

  // NOTE: We are setting auth0Id first time when users signs up. This way we can consider this id as primary user.
  const primaryUser = users.data.find((u) => {
    u.user_id === auth0Id;
  });

  const secondaryUser = users.data.find((u) => {
    u.user_id !== auth0Id;
  });

  if (!primaryUser || !secondaryUser) {
    throw new Error("Primary or secondary user not found.");
  }

  await managementClient.users.link(
    { id: primaryUser?.user_id },
    {
      user_id: secondaryUser?.user_id,
      provider: secondaryUser?.identities[0]
        .provider as PostIdentitiesRequestProviderEnum,
      connection_id: secondaryUser?.identities[0].connection,
    },
  );
};
