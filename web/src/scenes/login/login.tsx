import { useEffect, useState } from "react";
import { Auth } from "src/components/Auth";
import { Button } from "src/components/Button";
import { Icon } from "src/components/Icon";
import { Link } from "src/components/Link";
import { Spinner } from "src/components/Spinner";
import { ILoginPageProps } from "src/pages/login";
import Image from "next/image";
import torShape from "public/images/tor-shape.svg";
import cn from "classnames";
import { loginErrors } from "@/lib/constants";

export function Login({ error }: ILoginPageProps) {
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (error) {
      setLoginError(loginErrors[error]);
    }
  }, [error]);

  return (
    <Auth pageTitle="Login" pageUrl="login">
      <div className="grid w-full min-h-screen grid-rows-[auto_1fr] py-8">
        <div className="flex justify-between items-center px-24 border-b border-gray-900/10 pb-6">
          <div className="grid">
            <Icon name="logo" className="w-[141px] h-6" />

            <span className="text-12 justify-self-end leading-none font-rubik">
              {"<"}
              <span className="font-medium">Dev</span>
              {"/Portal>"}
            </span>
          </div>

          <div className="grid grid-flow-col items-center gap-6">
            <Link href="/api/auth/login" className="contents">
              <Button
                className="flex gap-x-1 justify-between items-center px-6 py-2.5 text-16 text-gray-500 font-semibold"
                variant="secondary"
              >
                <span className="leading-[1.25]">Log in</span>
                <Icon name="arrow-right" className="w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>

        <div
          className={cn(
            "grid items-center justify-items-center w-full text-center",
            { "content-start": !loading }
          )}
        >
          {loginError && (
            <div className="bg-danger-light px-6 py-4 mb-20 -mt-10 rounded-md text-danger font-medium">
              {loginError}
            </div>
          )}

          {loading && <Spinner className="mt-4" />}

          {!loading && (
            <>
              <div className="relative w-full h-[290px] overflow-hidden">
                <div className="absolute inset-x-0 -top-36 grid grid-cols-1 grid-rows-1 justify-items-center items-center">
                  <Image
                    src={torShape}
                    alt="tor shape illustration"
                    className="col-start-1 row-start-1"
                  />

                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white h-[80%]" />

                  <Icon
                    name="logomark"
                    className="w-16 h-16 col-start-1 row-start-1"
                  />
                </div>
              </div>

              <div className="justify-self-center max-w-[598px]">
                <h1 className="mt-9 text-32 font-semibold font-sora">
                  World ID is now generally available!
                </h1>

                <p className="mt-4 font-rubik text-20 text-657080">
                  The Worldcoin Protocol will enable a new class of applications
                  built on top of proof of personhood.
                </p>

                <p className="mt-6 font-sora">
                  Build for the People of the World
                </p>

                <div className="grid grid-cols-2 gap-x-4 mt-12">
                  <Link
                    href="https://docs.worldcoin.org"
                    className="contents"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      className="flex flex-1 justify-between py-4 px-6 text-657080 text-16 font-semibold"
                      variant="secondary"
                    >
                      Explore Docs <Icon name="book" className="w-6 h-6" />
                    </Button>
                  </Link>

                  <Link href="/api/auth/login" className="contents">
                    <Button
                      type="button"
                      className="flex flex-1 justify-between px-6 py-4 text-16 font-semibold"
                    >
                      Log in or Sign up
                      <Icon name="arrow-right" className="w-6 h-6" />
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Auth>
  );
}
