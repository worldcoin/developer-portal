import { AffiliateOverviewResponse } from "@/lib/types";

export const getXAxisLabels = (
  period: AffiliateOverviewResponse["result"]["period"],
) => {
  if (period === "day") {
    return "HH:mm";
  } else if (period === "week" || period === "month") {
    return "DD MMM";
  } else if (period === "year") {
    return "MMM YYYY";
  }
};
