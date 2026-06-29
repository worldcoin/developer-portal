import "server-only";

export const isPortalV3Enabled = (): boolean =>
  process.env.LOCAL_DEV_PORTAL_V3_ENABLED === "true";
