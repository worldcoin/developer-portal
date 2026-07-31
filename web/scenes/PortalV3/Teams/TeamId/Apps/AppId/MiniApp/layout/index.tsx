import { SizingWrapper } from "@/components/SizingWrapper";
import { SectionLoading } from "@/scenes/PortalV3/common/SectionLoading";
import { ReactNode, Suspense } from "react";

// Left-aligned, full-width frame (overrides SizingWrapper's centered column).
// The shared `nav` variant centers content inside a max-width track, which on
// wide monitors leaves large symmetric gutters and makes the page read as
// "floating in the middle". Instead, fill the area right of the sidebar with
// fixed side padding and cap only on ultra-wide so line lengths stay sane.
export const MiniAppLayout = (props: { children: ReactNode }) => {
  return (
    <SizingWrapper
      className="w-full max-w-[1600px]"
      gridClassName="grid-cols-[24px_minmax(0,1fr)_24px] md:grid-cols-[40px_minmax(0,1fr)_40px] xl:grid-cols-[64px_minmax(0,1fr)_64px]"
    >
      {/* Boundary below the persistent shell: entering Mini App commits the
          navigation immediately and streams the page in behind it. */}
      <Suspense fallback={<SectionLoading />}>{props.children}</Suspense>
    </SizingWrapper>
  );
};
