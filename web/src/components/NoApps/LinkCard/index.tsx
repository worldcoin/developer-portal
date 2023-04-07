import { memo } from "react";
import { Icon } from "src/components/Icon";
import { Link } from "src/components/Link";

export const LinkCard = memo(function LinkCard(props: {
  href: string;
  external?: boolean;
  heading: string;
  description: string;
}) {
  return (
    <Link
      className="grid gap-y-2 py-6 px-5 bg-gray-50 border border-gray-100 rounded-xl relative"
      href={props.href}
      external={props.external}
    >
      <span className="text-14 font-medium text-gray-900">{props.heading}</span>
      <p className="text-14 text-gray-900/80">{props.description}</p>

      {props.external && (
        <Icon
          name="external"
          className="absolute top-4 right-4 h-5 w-5 text-gray-900"
        />
      )}
    </Link>
  );
});
