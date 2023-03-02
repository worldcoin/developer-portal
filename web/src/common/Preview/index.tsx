import { memo } from "react";
import cn from "classnames";
import { Link } from "src/common/components/Link";
import { AppLogo } from "src/common/AppLogo";
import { AppType } from "src/lib/types";

interface PreviewInterface {
  app: AppType;
  className?: string;
  message: string;
}

export const Preview = memo(function Preview(props: PreviewInterface) {
  return (
    <div
      className={cn(
        "relative w-[375px] h-[812px] bg-[url(/images/preview-phone-bg.png)] bg-contain bg-no-repeat bg-ffffff",
        "rounded-[40px] overflow-hidden border-[6px] border-[#183c4a] before:absolute before:inset-0 before:bg-neutral-dark/50",
        "after:absolute after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-[134px] after:h-1 after:z-10",
        "after:bg-ffffff/20 after:rounded-full",
        props.className
      )}
    >
      <div
        className={cn(
          "absolute bottom-0 grid gap-y-6 bg-[#0c0e10] rounded-[30px] mt-6 p-6 pt-16 pb-10 text-center text-ffffff",
          "before:absolute before:top-2 before:left-1/2 before:-translate-x-1/2 before:bg-ffffff before:w-8",
          "before:h-[5px] before:rounded-full"
        )}
      >
        <AppLogo
          app={props.app}
          className="w-[64px] h-[64px] place-self-center"
          textClassName="text-20"
        />

        <p className="mt-2 leading-[28px] tracking-tight text-[26px] text-neutral">
          <span className="text-ffffff">{props.app.name}</span> wants to verify
          that you haven&apos;t done this before
        </p>

        <p className="text-13 p-4 border border-[#3c4040] rounded-lg leading-4">
          {props.message}
        </p>

        <Link
          href="#"
          className={cn(
            "mt-1.5 p-0.5 uppercase rounded-xl leading-5 shadow-[0_10px_20px_0_rgba(255,104,72,0.2)]",
            "bg-[linear-gradient(#0c0e10,#0c0e10),_radial-gradient(circle_at_top_left,#ff0000,#3020ff)]",
            "bg-origin-border [background-clip:content-box,_border-box] hover:opacity-70 transition-opacity"
          )}
        >
          <span className="block p-5">verify with world id</span>
        </Link>

        <Link
          className="transition-opacity text-d1d3d4 text-12 hover:opacity-70"
          href="#"
        >
          Dismiss
        </Link>
      </div>
    </div>
  );
});
