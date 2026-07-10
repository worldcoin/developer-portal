import "server-only";

import { logger } from "@/lib/logger";

export type NetworkStat = {
  label: string;
  value: string;
};

const METRICS_ENDPOINT = "https://metrics.worldcoin.org/";
const METRICS_FETCH_TIMEOUT_MS = 3000;

const FALLBACK_NETWORK_STATS: NetworkStat[] = [
  { label: "Verified humans", value: "18M+" },
  { label: "Proofs generated", value: "268M" },
  { label: "Countries", value: "191" },
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
      signal: AbortSignal.timeout(METRICS_FETCH_TIMEOUT_MS),
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
        label: "Verified humans",
        value: formatCompactNumber(humansVerified),
      },
      {
        label: "Proofs generated",
        value: formatCompactNumber(proofsGenerated),
      },
      {
        label: "Countries",
        value: countriesUsingWorldId.toLocaleString("en"),
      },
    ];
  } catch (error) {
    logger.warn("Failed to fetch landing network metrics", { error });

    return FALLBACK_NETWORK_STATS;
  }
};
