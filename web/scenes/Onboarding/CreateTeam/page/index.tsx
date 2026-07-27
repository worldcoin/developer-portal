import { WorldIcon } from "@/components/Icons/WorldIcon";
import { auth0 } from "@/lib/auth0";
import type { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CreateTeamAccountMenu } from "../AccountMenu";
import { CREATE_TEAM_DIALOG_URL } from "../dialogRouting";
import { CreateTeamForm } from "../Form";

export const CreateTeamPage = async () => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];

  if (!user) {
    return redirect(urls.logout());
  }

  const hasPortalUser = Boolean(user.hasura?.id);
  const hasTeamMembership = Boolean(user.hasura?.memberships?.length);
  const userInitial = user.name.trim().charAt(0).toLocaleUpperCase() || "?";

  if (hasTeamMembership) {
    return redirect(CREATE_TEAM_DIALOG_URL);
  }

  return (
    <div className="relative h-dvh overflow-hidden overscroll-none bg-[#faf9f7] font-world text-[#101010]">
      <WorldIcon
        variant="outline"
        aria-hidden="true"
        className="pointer-events-none absolute top-[42%] left-1/2 size-[180vw] max-w-none -translate-x-1/2 -translate-y-1/2 text-black/[0.055] md:size-[100vw]"
      />

      <header className="absolute inset-x-0 top-0 z-20">
        <Image
          src="/icons/logo.svg"
          width={220}
          height={55}
          alt="World"
          priority
          className="absolute top-8 left-1/2 h-auto w-[150px] -translate-x-1/2 md:top-[72px] md:w-[220px]"
        />

        <div className="absolute top-5 right-5 md:top-8 md:right-10">
          <CreateTeamAccountMenu userInitial={userInitial} />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[1440px] items-end px-5 pt-36 pb-8 md:px-10 md:pt-48 md:pb-[clamp(48px,10.8vh,108px)] xl:px-0">
        <section className="w-full">
          <div className="flex items-end justify-between gap-8 px-2 pb-12 md:px-8 md:pb-[78px]">
            <h1 className="text-[clamp(52px,6.1vw,92px)] leading-[1.02] font-medium tracking-[-0.045em]">
              Create your team
            </h1>

            <p className="md:text-22 mb-2 hidden shrink-0 text-20 leading-none font-semibold tracking-[0.08em] md:block">
              01&nbsp; / &nbsp;01
            </p>
          </div>

          <CreateTeamForm
            hasPortalUser={hasPortalUser}
            presentation="full-page"
          />
        </section>
      </main>
    </div>
  );
};
