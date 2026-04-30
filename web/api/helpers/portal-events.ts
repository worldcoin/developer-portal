import { logger } from "@/lib/logger";

type PortalActor = "human" | "mcp";

type PortalEventParams = {
  event: "app_creation" | "action_creation" | "app_submission";
  actor: PortalActor;
  team_id?: string;
  app_id?: string;
  action?: string;
  metadata?: Record<string, unknown>;
};

export const logPortalEvent = (params: PortalEventParams) => {
  logger.info(`portal_${params.event}`, {
    actor: params.actor,
    team_id: params.team_id,
    app_id: params.app_id,
    action: params.action,
    ...params.metadata,
  });
};
