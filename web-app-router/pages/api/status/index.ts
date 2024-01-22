import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "@/legacy/lib/logger";

export type GetMonitorsResponse = {
  stat: "ok" | "fail";
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
  monitors: Array<{
    id: number;
    friendly_name: string;
    url: string;
    type: number;
    sub_type: string;
    keyword_type: 1 | 2 | null;
    keyword_case_type: 0 | 1 | null;
    keyword_value: string;
    http_username: string;
    http_password: string;
    port: string;
    interval: number;
    timeout: unknown | null;
    status: number;
    create_datetime: number;
  }>;
};

type StatusResponse = Pick<GetMonitorsResponse, "stat"> | Error;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  const API_KEY = process.env.UPTIME_ROBOT_API_KEY;
  const _BASE_URL = "https://api.uptimerobot.com/v2/";

  const _getUrl = (route: string) => {
    const url = new URL(route, _BASE_URL);
    url.searchParams.append("api_key", API_KEY as string);
    url.searchParams.append("format", "json");
    return url.toString();
  };

  const fetcher = async <T = any>(url: string): Promise<T | Error> => {
    let result;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      result = await response.json();
    } catch (error) {
      return Error("Error fetching data", { cause: error as Error });
    }

    return result;
  };

  const result = await fetcher<GetMonitorsResponse>(_getUrl("getMonitors"));

  if (result instanceof Error) {
    logger.error("Uptime robot error", { req, error: result });
    return res.status(500).json({
      message: result.message,
      name: result.name,
      cause: result.cause,
    });
  }

  return res.status(200).json({ stat: result.stat });
}
