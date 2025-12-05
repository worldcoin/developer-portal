"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchPendingAffiliates } from "./server/fetch-pending-affiliates";
import { updateAffiliateStatus } from "./server/update-affiliate-status";

type PendingTeam = {
  id: string;
  name: string | null;
  affiliate_status: string;
  created_at: string;
};

export const AdminAffiliatesPage = () => {
  const [teams, setTeams] = useState<PendingTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTeamId, setProcessingTeamId] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPendingAffiliates();
      if (result.success && result.teams) {
        setTeams(result.teams);
      } else {
        toast.error(result.message || "Failed to load pending affiliates");
      }
    } catch {
      toast.error("Failed to load pending affiliates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleUpdateStatus = async (
    teamId: string,
    status: "approved" | "rejected",
  ) => {
    setProcessingTeamId(teamId);
    try {
      const result = await updateAffiliateStatus(teamId, status);
      if (result.success) {
        toast.success(result.message);
        // Remove the team from the list
        setTeams((prev) => prev.filter((t) => t.id !== teamId));
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to update affiliate status");
    } finally {
      setProcessingTeamId(null);
    }
  };

  return (
    <SizingWrapper gridClassName="order-2 grow" className="py-8">
      <div className="space-y-6">
        <div>
          <Typography variant={TYPOGRAPHY.H6}>
            Pending Affiliate Requests
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="mt-1 text-grey-500">
            Review and approve or reject affiliate program requests from teams
          </Typography>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
              Loading...
            </Typography>
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-xl border border-grey-200 p-8 text-center">
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
              No pending affiliate requests
            </Typography>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-xl border border-grey-200 p-4"
              >
                <div>
                  <Typography variant={TYPOGRAPHY.M3}>
                    {team.name || "Unnamed Team"}
                  </Typography>
                  <Typography
                    variant={TYPOGRAPHY.R5}
                    className="mt-1 text-grey-500"
                  >
                    ID: {team.id}
                  </Typography>
                  <Typography
                    variant={TYPOGRAPHY.R5}
                    className="mt-0.5 text-grey-400"
                  >
                    Requested:{" "}
                    {new Date(team.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Typography>
                </div>

                <div className="flex gap-2">
                  <DecoratedButton
                    type="button"
                    variant="secondary"
                    onClick={() => handleUpdateStatus(team.id, "rejected")}
                    disabled={processingTeamId === team.id}
                    className="text-system-error-600"
                  >
                    Reject
                  </DecoratedButton>
                  <DecoratedButton
                    type="button"
                    variant="primary"
                    onClick={() => handleUpdateStatus(team.id, "approved")}
                    disabled={processingTeamId === team.id}
                  >
                    Approve
                  </DecoratedButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SizingWrapper>
  );
};

