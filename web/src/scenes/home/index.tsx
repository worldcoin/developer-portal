import Link from "next/link";
import { Button } from "src/components/Button";
import { Icon } from "src/components/Icon";
import { urls } from "src/lib/urls";

export function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] p-8">
      <div className="flex justify-between items-center">
        <Icon name="logo" className="w-48 h-8" />

        <Link href={urls.login()}>
          <Button variant="secondary" className="py-3 px-8">
            Log in
          </Button>
        </Link>
      </div>

      <div className="grid place-content-center justify-items-center justify-self-center max-w-[532px] text-center">
        <div className="relative">
          <Icon name="wld-logo" className="w-16 h-16" />
          {/* span[className="absolute rounded-full"]/*3 */}
          <span className="absolute rounded-full bg-[#f7b12f] w-32 h-32 blur-xl opacity-[.15] left-1/2 -translate-x-1/2 bottom-1.5" />
          <span className="absolute rounded-full bg-[#007fd3] w-32 h-32 blur-xl opacity-10 top-[7px] right-px" />
          <span className="absolute rounded-full bg-[#ff4231] w-32 h-32 blur-xl opacity-10 left-[52px] bottom-[-22px]" />
        </div>

        <h1 className="mt-9 text-32 font-semibold font-sora">
          Build for the People of the World
        </h1>

        <p className="mt-4 font-rubik text-20 text-657080">
          The Worldcoin Protocol will enable a new class of applications built
          on top of proof of personhood.
        </p>

        <p className="mt-6 font-sora">
          Join the waitlist for early access to the SDK.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full">
          <a href="https://docs.worldcoin.org" className="contents">
            <Button
              className="flex flex-1 justify-between py-5 px-6 text-657080 text-16 font-semibold"
              variant="secondary"
            >
              Explore Docs <Icon name="book" className="w-6 h-6" />
            </Button>
          </a>

          <a href="https://docs.worldcoin.org/waitlist" className="contents">
            <Button className="flex flex-1 justify-between px-6 py-5 text-16 font-semibold">
              Join Waitlist
              <Icon name="arrow-right" className="w-6 h-6" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
