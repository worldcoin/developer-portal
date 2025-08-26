import axios from "axios";

// Auth0 token response interface
interface Auth0TokenResponse {
  access_token: string;
  id_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

// Auth0 error response interface
interface Auth0ErrorResponse {
  error: string;
  error_description: string;
}

/**
 * Get Auth0 token using Client Credentials Grant (Machine-to-Machine)
 * @returns Promise<string> - Access token
 */
export async function getAuth0Token(): Promise<string> {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const audience = process.env.AUTH0_AUDIENCE;

  // Validate required environment variables
  if (!domain) {
    throw new Error("AUTH0_DOMAIN environment variable is required");
  }
  if (!clientId) {
    throw new Error("AUTH0_CLIENT_ID environment variable is required");
  }
  if (!clientSecret) {
    throw new Error("AUTH0_CLIENT_SECRET environment variable is required");
  }
  if (!audience) {
    throw new Error("AUTH0_AUDIENCE environment variable is required");
  }

  const tokenUrl = `https://${domain}/oauth/token`;

  const requestBody = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    audience: audience,
  };

  try {
    console.log("Getting Auth0 client credentials token...");

    const response = await axios.post<Auth0TokenResponse>(tokenUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log("✅ Auth0 client token obtained successfully");
    return response.data.access_token;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as Auth0ErrorResponse;
      console.error("❌ Auth0 token request failed:", {
        status: error.response.status,
        error: errorData.error,
        description: errorData.error_description,
      });

      throw new Error(`Auth0 error: ${errorData.error} - ${errorData.error_description}`);
    }

    // Handle network errors
    if (error.code === "ECONNABORTED") {
      throw new Error("Auth0 token request timed out");
    }

    throw new Error(`Failed to get Auth0 token: ${error.message}`);
  }
}