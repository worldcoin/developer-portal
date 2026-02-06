/**
 * Adapts action_v4 structure to match TryAction component expectations
 *
 * V4 structure: { action, description, environment, rp_registration: { app_id } }
 * TryAction expects: { name, description, action, app_id, app: { is_staging, engine, app_metadata } }
 */
export function adaptActionV4ForTryAction(action: {
  action: string;
  description: string;
  environment: string;
  rp_registration: {
    app_id: string;
  };
}) {
  return {
    name: action.action, // V4 doesn't have separate name field, use identifier
    description: action.description,
    action: action.action,
    app_id: action.rp_registration.app_id,
    app: {
      is_staging: action.environment === "staging",
      engine: "cloud" as const, // V4 actions are always cloud-based
      app_metadata: [], // V4 doesn't have app_metadata
    },
  };
}
