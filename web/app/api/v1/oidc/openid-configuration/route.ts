// The discovery document includes `issuer` (JWT_ISSUER), read from the runtime
// environment. The Docker image is built once with a placeholder
// JWT_ISSUER=invalid.localhost and deployed to multiple envs, so this route must
// stay dynamic — a static prerender would bake the build-time placeholder issuer
// and OIDC clients would reject tokens from the deployed environment.
// (Route segment config must be declared directly in the route module — Turbopack
// does not read a re-exported `dynamic`.)
export { GET, OPTIONS } from "@/api/v1/oidc/openid-configuration";
export const dynamic = "force-dynamic";
