import { memo } from "react";
import { Icon, IconType } from "@/components/Icon";
import { Link } from "@/components/Link";
import cn from "classnames";

export interface PageInfoProps {
  icon: IconType;
  iconClassName?: string;
  title: string;
  text: string | string[];
  linkText?: string;
  linkHref?: string;
}

export const PageInfo = memo(function PageInfo(props: PageInfoProps) {
  return (
    <section className="relative flex gap-x-8 p-8 bg-f9fafb border border-ebecef rounded-xl">
      <div className="flex items-center justify-center w-16 h-16 bg-ffffff border border-f3f4f5 rounded-full">
        <Icon
          name={props.icon}
          className={cn(props.iconClassName, "h-6 w-6")}
        />
      </div>
      <div className="flex flex-col gap-y-1 self-center">
        <h2 className="font-sora text-16 font-semibold leading-5">
          {props.title}
        </h2>
        {(Array.isArray(props.text) ? props.text : [props.text]).map(
          (line, i) => (
            <p key={i} className="max-w-[720px] text-14 text-657080 leading-4">
              {line}
            </p>
          )
        )}
      </div>
      {props.linkText && props.linkHref && (
        <Link
          className="absolute top-4 right-4 flex items-center gap-x-1 h-9 px-4 text-14 bg-ffffff border border-ebecef rounded-lg hover:opacity-70 transition-opacity"
          href={props.linkHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {props.linkText}
          <Icon name="arrow-right" className="w-4 h-4" />
        </Link>
      )}
    </section>
  );
});
