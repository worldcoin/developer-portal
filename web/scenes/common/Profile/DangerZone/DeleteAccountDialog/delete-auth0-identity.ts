import { urls } from "@/lib/urls";

/**
 * Deletes the caller's Auth0 identity after the Hasura user row is gone.
 *
 * Must be a POST: the endpoint is authenticated by the `SameSite=Lax` session
 * cookie, which the browser would also attach to a cross-site top-level GET
 * navigation, so a navigable delete is CSRF-able from any attacker page. The
 * response is a 204 — logout navigation is the caller's job.
 */
export const deleteAuth0Identity = async (): Promise<void> => {
  const response = await fetch(urls.api.authDeleteAccount(), {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to delete Auth0 identity: ${response.status} ${response.statusText}`,
    );
  }
};
