import { CardWithSideGradient } from "common/CardWithSideGradient";
import { Link } from "common/components/Link";
import { Icon, IconType } from "common/Icon";
import { Button } from "common/LegacyButton";
import { memo } from "react";

export const NotFound = memo(function NotFound(props: {
  heading: string;
  description: string;
  icon: IconType;
  linkLabel: string;
  link: string;
}) {
  return (
    <CardWithSideGradient lineClassName="opacity-20" className="max-h-52">
      <div className="grid px-3 py-3 grid-cols-auto/1fr/auto items-center gap-x-12">
        <Icon name={props.icon} className="w-32 h-32" noMask />

        <div className="grid gap-y-2">
          <h1 className="text-20 font-semibold">{props.heading}</h1>
          <p className="text-neutral max-w-[415px]">{props.description}</p>
        </div>

        <Button
          color="primary"
          variant="contained"
          component={Link}
          href={props.link}
        >
          {props.linkLabel}
        </Button>
      </div>
    </CardWithSideGradient>
  );
});
