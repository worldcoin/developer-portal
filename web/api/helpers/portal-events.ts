import { logger } from "@/lib/logger";

type PortalActor = "human" | "mcp";

type PortalEventName =
  | "app_creation"
  | "app_draft_creation"
  | "action_creation"
  | "app_submission"
  | "action_verification";

type PortalEventParams = {
  event: PortalEventName;
  actor: PortalActor;
  team_id?: string;
  app_id?: string;
  action?: string;
  metadata?: Record<string, unknown>;
};

export const logPortalEvent = (params: PortalEventParams) => {
  logger.info(`portal_${params.event}`, {
    event: params.event,
    actor: params.actor,
    team_id: params.team_id,
    app_id: params.app_id,
    action: params.action,
    ...params.metadata,
  });
};
