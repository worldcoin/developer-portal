import crypto from "crypto";
import { GraphQLClient } from "graphql-request";

// GraphQL client with admin privileges for creating test data
export const adminGraphqlClient = new GraphQLClient(
  process.env.HASURA_GRAPHQL_URL!,
  {
    headers: {
      "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
    },
  },
);

// Simple GraphQL mutation for creating app
const CREATE_APP_MUTATION = `
  mutation CreateApp($object: app_insert_input!) {
    insert_app_one(object: $object) {
      id
    }
  }
`;

// Simple GraphQL query for getting app
const GET_APP_QUERY = `
  query GetApp($id: String!) {
    app_by_pk(id: $id) {
      id
      is_banned
      name
    }
  }
`;

// Simple GraphQL mutation for creating team
const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($object: team_insert_input!) {
    insert_team_one(object: $object) {
      id
    }
  }
`;

// Simple GraphQL mutation for creating user
const CREATE_USER_MUTATION = `
  mutation CreateUser($object: user_insert_input!) {
    insert_user_one(object: $object) {
      id
    }
  }
`;

// Simple GraphQL mutation for deleting app
const DELETE_APP_MUTATION = `
  mutation DeleteApp($id: String!) {
    delete_app_by_pk(id: $id) {
      id
    }
  }
`;

// Simple GraphQL mutation for deleting team
const DELETE_TEAM_MUTATION = `
  mutation DeleteTeam($id: String!) {
    delete_team_by_pk(id: $id) {
      id
    }
  }
`;

// Simple GraphQL mutation for deleting user
const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: String!) {
    delete_user_by_pk(id: $id) {
      id
    }
  }
`;

const FIND_USER_BY_AUTH0_QUERY = `
  query FindUserByAuth0Id($auth0Id: String!) {
    user(where: {auth0Id: {_eq: $auth0Id}}) {
      id
    }
  }
`;

// Simple GraphQL mutation for creating app_metadata
const CREATE_APP_METADATA_MUTATION = `
  mutation CreateAppMetadata($object: app_metadata_insert_input!) {
    insert_app_metadata_one(object: $object) {
      id
      verification_status
    }
  }
`;

// Simple GraphQL mutation for deleting app_metadata
const DELETE_APP_METADATA_MUTATION = `
  mutation DeleteAppMetadata($id: String!) {
    delete_app_metadata_by_pk(id: $id) {
      id
    }
  }
`;

// Simple GraphQL mutation for creating membership
const CREATE_MEMBERSHIP_MUTATION = `
  mutation CreateMembership($object: membership_insert_input!) {
    insert_membership_one(object: $object) {
      id
      user_id
      team_id
      role
    }
  }
`;

// Simple GraphQL mutation for deleting membership
const DELETE_MEMBERSHIP_MUTATION = `
  mutation DeleteMembership($id: String!) {
    delete_membership_by_pk(id: $id) {
      id
    }
  }
`;

// Simple GraphQL mutation for creating localisation
const CREATE_LOCALISATION_MUTATION = `
  mutation CreateLocalisation($object: localisations_insert_input!) {
    insert_localisations_one(object: $object) {
      id
      locale
      name
      short_name
      description
      world_app_description
    }
  }
`;

// Simple GraphQL mutation for deleting localisation
const DELETE_LOCALISATION_MUTATION = `
  mutation DeleteLocalisation($id: String!) {
    delete_localisations_by_pk(id: $id) {
      id
    }
  }
`;

// Simple GraphQL mutation for creating api_key
const CREATE_API_KEY_MUTATION = `
  mutation CreateApiKey($object: api_key_insert_input!) {
    insert_api_key_one(object: $object) {
      id
      team_id
      api_key
    }
  }
`;

// Simple GraphQL mutation for deleting api_key
const DELETE_API_KEY_MUTATION = `
  mutation DeleteApiKey($id: String!) {
    delete_api_key_by_pk(id: $id) {
      id
    }
  }
`;

// Simple GraphQL mutation for creating action
const CREATE_ACTION_MUTATION = `
  mutation CreateAction($object: action_insert_input!) {
    insert_action_one(object: $object) {
      id
      app_id
      action
      name
      external_nullifier
    }
  }
`;

// Simple GraphQL mutation for deleting action
const DELETE_ACTION_MUTATION = `
  mutation DeleteAction($id: String!) {
    delete_action_by_pk(id: $id) {
      id
    }
  }
`;

// Helper for creating test app
export const createTestApp = async (name: string, teamId: string) => {
  try {
    const response = (await adminGraphqlClient.request(CREATE_APP_MUTATION, {
      object: {
        name,
        team_id: teamId,
        engine: "cloud",
        is_staging: true,
        status: "active",
        // Use only required fields, others will be filled with defaults
      },
    })) as any;

    return response.insert_app_one?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to create test app: ${errorMessage}`);
  }
};

// Helper for getting app by ID
export const getAppById = async (appId: string) => {
  try {
    const response = (await adminGraphqlClient.request(GET_APP_QUERY, {
      id: appId,
    })) as any;

    return response.app_by_pk;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to get app ${appId}: ${errorMessage}`);
  }
};

// Helper for creating test team
export const createTestTeam = async (name: string) => {
  try {
    const response = (await adminGraphqlClient.request(CREATE_TEAM_MUTATION, {
      object: {
        name,
      },
    })) as any;

    return response.insert_team_one?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to create test team: ${errorMessage}`);
  }
};

// Helper for creating test user
export const createTestUser = async (email: string, teamId?: string) => {
  try {
    const response = (await adminGraphqlClient.request(CREATE_USER_MUTATION, {
      object: {
        email,
        auth0Id: `auth0|test_${Date.now()}`,
        ...(teamId && { team_id: teamId }),
        ironclad_id: `ironclad_test_${Date.now()}`,
        world_id_nullifier: `0x${Date.now().toString(16)}`,
      },
    })) as any;

    return response.insert_user_one?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to create test user: ${errorMessage}`);
  }
};

// Helper for deleting test app
export const deleteTestApp = async (appId: string) => {
  try {
    const response = (await adminGraphqlClient.request(DELETE_APP_MUTATION, {
      id: appId,
    })) as any;

    return response.delete_app_by_pk?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to delete test app ${appId}: ${errorMessage}`);
  }
};

// Helper for deleting test team
export const deleteTestTeam = async (teamId: string) => {
  try {
    const response = (await adminGraphqlClient.request(DELETE_TEAM_MUTATION, {
      id: teamId,
    })) as any;

    return response.delete_team_by_pk?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to delete test team ${teamId}: ${errorMessage}`);
  }
};

// Helper for finding user by auth0Id
export const findUserByAuth0Id = async (auth0Id: string) => {
  try {
    const response = (await adminGraphqlClient.request(
      FIND_USER_BY_AUTH0_QUERY,
      {
        auth0Id,
      },
    )) as any;

    return response.user?.[0]?.id || null;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(
      `Failed to find user by auth0Id ${auth0Id}: ${errorMessage}`,
    );
  }
};

// Helper for deleting test user
export const deleteTestUser = async (userId: string) => {
  try {
    const response = (await adminGraphqlClient.request(DELETE_USER_MUTATION, {
      id: userId,
    })) as any;

    return response.delete_user_by_pk?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to delete test user ${userId}: ${errorMessage}`);
  }
};

// Helper for creating test app_metadata
export const createTestAppMetadata = async (
  appId: string,
  name: string,
  verificationStatus:
    | "unverified"
    | "verified"
    | "awaiting_review"
    | "changes_requested" = "awaiting_review",
  showcaseImgUrls?: string[],
  supportedLanguages?: string[],
) => {
  try {
    const response = (await adminGraphqlClient.request(
      CREATE_APP_METADATA_MUTATION,
      {
        object: {
          app_id: appId,
          name,
          description: "Test app description",
          logo_img_url: "logo_img.png",
          verification_status: verificationStatus,
          ...(showcaseImgUrls && { showcase_img_urls: showcaseImgUrls }),
          supported_languages: supportedLanguages,
          // Use only required fields, others will be filled with defaults
        },
      },
    )) as any;

    return response.insert_app_metadata_one;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to create test app metadata: ${errorMessage}`);
  }
};

// Helper for deleting test app_metadata
export const deleteTestAppMetadata = async (metadataId: string) => {
  try {
    const response = (await adminGraphqlClient.request(
      DELETE_APP_METADATA_MUTATION,
      {
        id: metadataId,
      },
    )) as any;

    return response.delete_app_metadata_by_pk?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(
      `Failed to delete test app metadata ${metadataId}: ${errorMessage}`,
    );
  }
};

// Helper for creating test membership
export const createTestMembership = async (
  userId: string,
  teamId: string,
  role: "OWNER" | "ADMIN" | "MEMBER" = "OWNER",
) => {
  try {
    const response = (await adminGraphqlClient.request(
      CREATE_MEMBERSHIP_MUTATION,
      {
        object: {
          user_id: userId,
          team_id: teamId,
          role: role,
        },
      },
    )) as any;

    return response.insert_membership_one?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to create test membership: ${errorMessage}`);
  }
};

// Helper for deleting test membership
export const deleteTestMembership = async (membershipId: string) => {
  try {
    const response = (await adminGraphqlClient.request(
      DELETE_MEMBERSHIP_MUTATION,
      {
        id: membershipId,
      },
    )) as any;

    return response.delete_membership_by_pk?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(
      `Failed to delete test membership ${membershipId}: ${errorMessage}`,
    );
  }
};

// Helper for creating test localisation
export const createTestLocalisation = async (
  appMetadataId: string,
  locale: string,
  name: string,
  shortName: string,
  description: string,
  worldAppDescription: string,
) => {
  try {
    const response = (await adminGraphqlClient.request(
      CREATE_LOCALISATION_MUTATION,
      {
        object: {
          app_metadata_id: appMetadataId,
          locale,
          name,
          short_name: shortName,
          description,
          world_app_description: worldAppDescription,
        },
      },
    )) as any;

    return response.insert_localisations_one?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to create test localisation: ${errorMessage}`);
  }
};

// Helper for deleting test localisation
export const deleteTestLocalisation = async (localisationId: string) => {
  try {
    const response = (await adminGraphqlClient.request(
      DELETE_LOCALISATION_MUTATION,
      {
        id: localisationId,
      },
    )) as any;

    return response.delete_localisations_by_pk?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(
      `Failed to delete test localisation ${localisationId}: ${errorMessage}`,
    );
  }
};

// Helper for creating test API key with real credentials for HTTP auth
export const createTestApiKey = async (
  teamId: string,
  name: string = "Test API Key",
) => {
  const AUTH0_SECRET = process.env.AUTH0_SECRET;
  if (!AUTH0_SECRET) {
    throw new Error("AUTH0_SECRET env var must be set for tests");
  }

  // Step 1: Generate friendly ID in Hasura format (key_xxxxxxxxxx)
  const randomId = crypto.randomBytes(8).toString("hex");
  const keyId = `key_${randomId}`;

  // Step 2: Generate secret and hash using the pre-generated ID
  const secret = `sk_${crypto.randomBytes(24).toString("hex")}`;
  const hmac = crypto.createHmac("sha256", AUTH0_SECRET);
  hmac.update(`${keyId}.${secret}`);
  const hashed_secret = hmac.digest("hex");

  // Step 3: Create API key record with the generated ID and hash in one operation
  const createResponse = (await adminGraphqlClient.request(
    CREATE_API_KEY_MUTATION,
    {
      object: {
        id: keyId, // Use our pre-generated ID
        team_id: teamId,
        api_key: hashed_secret,
        name,
        is_active: true,
      },
    },
  )) as any;

  if (!createResponse.insert_api_key_one?.id) {
    throw new Error("Failed to create API key record");
  }

  // Step 4: Create proper API key header format for HTTP auth
  const credentials = `${keyId}:${secret}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");
  const apiKeyHeader = `api_${encodedCredentials}`;

  return {
    apiKeyId: keyId,
    secret,
    apiKeyHeader,
  };
};

// Helper for deleting test API key
export const deleteTestApiKey = async (apiKeyId: string) => {
  try {
    const response = (await adminGraphqlClient.request(
      DELETE_API_KEY_MUTATION,
      {
        id: apiKeyId,
      },
    )) as any;

    return response.delete_api_key_by_pk?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(
      `Failed to delete test API key ${apiKeyId}: ${errorMessage}`,
    );
  }
};

// Helper for creating test action
export const createTestAction = async (
  appId: string,
  actionName: string,
  name: string = "Test Action",
) => {
  try {
    const response = (await adminGraphqlClient.request(CREATE_ACTION_MUTATION, {
      object: {
        app_id: appId,
        action: actionName,
        name,
        description: "Test action description",
        external_nullifier: "", // Start with empty external_nullifier
      },
    })) as any;

    return response.insert_action_one?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(`Failed to create test action: ${errorMessage}`);
  }
};

// Helper for deleting test action
export const deleteTestAction = async (actionId: string) => {
  try {
    const response = (await adminGraphqlClient.request(DELETE_ACTION_MUTATION, {
      id: actionId,
    })) as any;

    return response.delete_action_by_pk?.id;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error";
    throw new Error(
      `Failed to delete test action ${actionId}: ${errorMessage}`,
    );
  }
};
