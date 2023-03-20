import { GetMonitorsResponse } from "src/pages/api/status";
import useSWR from "swr";

export const useUptimeRobot = () => {
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    const result = await response.json();
    return result;
  };

  const { data, error } = useSWR<GetMonitorsResponse>(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/status`,
    fetcher
  );

  return {
    status: data,
    error,
  };
};
