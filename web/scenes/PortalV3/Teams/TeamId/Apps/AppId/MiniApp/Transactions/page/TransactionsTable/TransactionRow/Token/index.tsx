import { USDCIcon } from "@/components/Icons/UsdcIcon";
import { WLDIcon } from "@/components/Icons/WLDIcon";
import { memo } from "react";

export const TokenIcon = memo(function TokenIcon(props: { token: string }) {
  const { token } = props;

  if (token === "USDCE") {
    return <USDCIcon className="size-8 " />;
  } else if (token === "WLD") {
    return <WLDIcon className="size-8" />;
  }
});
