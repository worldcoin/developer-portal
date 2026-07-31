import { SectionLoading } from "@/scenes/PortalV3/common/SectionLoading";
import { ReactNode, Suspense } from "react";

type Params = {
  teamId?: string;
};

type TeamLayoutProps = {
  params: Promise<Params>;
  children: ReactNode;
};

// v3: the old team tab layout was folded into the PortalV3 sidebar and the
// combined Team settings page, so this layout only adds the loading boundary
// (navigation commits below the persistent shell while the page streams in)
// and otherwise passes through to avoid a double nav.
export const TeamLayout = async (props: TeamLayoutProps) => {
  return <Suspense fallback={<SectionLoading />}>{props.children}</Suspense>;
};
