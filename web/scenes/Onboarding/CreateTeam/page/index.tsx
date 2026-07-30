import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Form } from "./Form";
import { getSdk as getFetchUserSdk } from "./graphql/server/fetch-user.generated";

export const CreateTeamPage = async () => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];

  if (!user) {
    return redirect(urls.logout());
  }

  // Existing portal users — including those who just deleted or left their
  // last team — create additional teams from their profile instead. This page
  // only onboards brand-new signups, whose terms acceptance is recorded when
  // the form is submitted.
  if (user.hasura?.id) {
    const client = await getAPIServiceGraphqlClient();

    const { user_by_pk } = await getFetchUserSdk(client).FetchUser({
      userId: user.hasura.id,
    });

    if (user_by_pk?.id) {
      return redirect(urls.profile());
    }
  }

  const signedInAs = user.email || user.name;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#faf9f7] font-world text-[#181818]">
      <WorldIcon
        variant="outline"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-0 size-[120vmin] max-w-none translate-x-[40%] -translate-y-1/2 text-black/[0.05]"
      />

      <header className="relative z-10 px-6 pt-8 md:px-12">
        <Image
          src="/icons/logo.svg"
          width={132}
          height={33}
          alt="World"
          priority
        />
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 md:px-12">
        <div className="mx-auto w-full max-w-[640px] py-16">
          <h1 className="text-12 leading-none font-medium tracking-[0.14em] text-[#757575] uppercase">
            Create your first team
          </h1>

          <Form />
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-8 md:px-12">
        <p className="mx-auto w-full max-w-[640px] text-12 leading-none text-[#9c9c9c]">
          Signed in as <span className="text-[#757575]">{signedInAs}</span>
          {" · "}
          <a
            href={urls.logout()}
            className="underline underline-offset-2 transition-colors hover:text-[#181818]"
          >
            Log out
          </a>
        </p>
      </footer>
    </div>
  );
};
