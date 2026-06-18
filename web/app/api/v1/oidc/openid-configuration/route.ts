// Turbopack (Next 16) only statically reads route segment config declared
// directly in the route module — a re-exported `dynamic` is not recognized — so
// declare it here and keep it in sync with the handler module.
export { GET, OPTIONS } from "@/api/v1/oidc/openid-configuration";
export const dynamic = "force-static";
