import { memo } from "react";
import { useValues } from "kea";
import { appsLogic } from "logics/appsLogic";
import Link from "next/link";
import { CardWithSideGradient } from "common/CardWithSideGradient";
import cn from "classnames";
import { urls } from "urls";

export const Appslist = memo(function Appslist() {
  const { apps } = useValues(appsLogic);

  return (
    <div className="grid gap-y-8">
      <CardWithSideGradient>
        <h1 className="font-semibold leading-8 font-sora text-30">My Apps</h1>
        <p className="mt-2 leading-4 font-sora text-14 text-858494">
          List all of your apps.
        </p>
      </CardWithSideGradient>

      <div className="grid gap-y-2">
        {apps.map((app) => (
          <Link href={urls.app(app.id)} key={app.id}>
            <a
              className={cn(
                "px-8 py-6 bg-ffffff rounded-xl shadow-sm",
                "hover:shadow-xl transition-shadow duration-[.35s] ease-in-out"
              )}
            >
              <span>{app.name}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
});
