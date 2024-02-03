import { SizingWrapper } from "@/components/SizingWrapper";
import { ExampleClientComponent } from "./ExampleClientComponent";
import { getSession } from "@auth0/nextjs-auth0";
import { inspect } from "util";
import { Auth0SessionUser } from "@/lib/types";
import { Suspense } from "react";

export const TeamPage = async () => {
  const session = await getSession();
  const user = session?.user as Auth0SessionUser;

  return (
    <SizingWrapper>
      <div className="grid gap-y-10">
        <div>
          <h1 className="text-3xl">Server side (getSession): </h1>

          <pre>{inspect(user, { depth: 10 })}</pre>
        </div>

        <hr className="bg-grey-900 text-grey-900 w-full h-1" />

        <div>
          <h2 className="text-3xl">Client side (useUser): </h2>

          <Suspense>
            <ExampleClientComponent />
          </Suspense>
        </div>
      </div>
    </SizingWrapper>
  );
};
