// POST only. Deleting the Auth0 identity is irreversible and authenticated by the
// `SameSite=Lax` session cookie alone, which the browser would attach to a
// cross-site top-level GET navigation. Next returns 405 for every other method.
export { deleteAccount as POST } from "@/api/delete-account";
