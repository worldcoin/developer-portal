import "server-only";

import { logger } from "@/lib/logger";

export type NetworkStat = {
  label: string;
  value: string;
};

const METRICS_ENDPOINT = "https://metrics.worldcoin.org/";

const FALLBACK_NETWORK_STATS: NetworkStat[] = [
  { label: "Humans verified", value: "18M" },
  { label: "Countries using World ID", value: "191" },
  { label: "Proofs generated", value: "267M" },
];

type MetricsPayload = {
  n_proofs?: unknown;
  n_verifications?: unknown;
  world_id_countries?: unknown;
};

const numberOrNull = (value: unknown) => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const formatCompactNumber = (value: number) => {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(value);
};

export const getNetworkStats = async (): Promise<NetworkStat[]> => {
  try {
    const response = await fetch(METRICS_ENDPOINT, {
      headers: {
        Accept: "application/json",
        "User-Agent": "DevPortal/1.0",
      },
      next: {
        revalidate: 300,
        tags: ["landing-network-metrics"],
      },
    });

    if (!response.ok) {
      logger.warn("Failed to fetch landing network metrics", {
        status: response.status,
      });

      return FALLBACK_NETWORK_STATS;
    }

    const payload = (await response.json()) as MetricsPayload;
    const humansVerified = numberOrNull(payload.n_verifications);
    const countriesUsingWorldId = numberOrNull(payload.world_id_countries);
    const proofsGenerated = numberOrNull(payload.n_proofs);

    if (
      humansVerified === null ||
      countriesUsingWorldId === null ||
      proofsGenerated === null
    ) {
      logger.warn("Landing network metrics payload is missing required fields");

      return FALLBACK_NETWORK_STATS;
    }

    return [
      {
        label: "Humans verified",
        value: formatCompactNumber(humansVerified),
      },
      {
        label: "Countries using World ID",
        value: countriesUsingWorldId.toLocaleString("en"),
      },
      {
        label: "Proofs generated",
        value: formatCompactNumber(proofsGenerated),
      },
    ];
  } catch (error) {
    logger.warn("Failed to fetch landing network metrics", { error });

    return FALLBACK_NETWORK_STATS;
  }
};
