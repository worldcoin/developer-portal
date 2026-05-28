// Route segment config (`dynamic`) must be re-exported from the route file
// itself — Next.js only reads it from the route module, not transitive imports.
export { GET, OPTIONS, dynamic } from "@/api/v1/oidc/openid-configuration";
