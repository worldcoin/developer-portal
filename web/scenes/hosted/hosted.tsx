import { Fragment } from "react";
import { useRouter } from "next/router";
import cn from "classnames";
import { styles } from "common/styles";
import { Button } from "common/Button";
import { Icon } from "common/Icon";
import { Link } from "common/Link";
import { AppLogo } from "common/AppLogo";
import { useActions, useValues } from "kea";
import { hostedPageLogic } from "./hostedPageLogic";
import { HostedError } from "./HostedError";
import { Preloader } from "common/Preloader";
import Head from "next/head";
import dynamic from "next/dynamic";

const loader = () => import("@worldcoin/id").then((mod) => mod.WorldIDWidget);
const WorldIDWidget = dynamic(loader, { ssr: false });

export default function Hosted(): JSX.Element {
  const router = useRouter();
  const logicProps = {
    signal: router.query.signal?.toString(),
    action_id: router.query.action_id?.toString(),
  };
  const logic = hostedPageLogic(logicProps);

  const { action, pageError, actionLoading, verifiedProof, returnUrlDomain } =
    useValues(hostedPageLogic);
  const { handleSuccess, handleError } = useActions(hostedPageLogic);

  return (
    <div className="min-h-screen grid grid-rows-auto/1fr/auto items-center bg-fafafa">
      <Head>
        <title>{`${
          action?.name || ""
        } Hosted page | Worldcoin Dev Portal`}</title>
      </Head>

      <div className="p-8 grid grid-flow-col justify-between">
        <Icon name="worldcoin" className="w-[236.67px] h-10" />
        {action?.app && (
          <div className="grid grid-flow-col gap-x-2 items-center font-medium text-14 leading-4">
            <span className="whitespace-nowrap">{action.app.name}</span>

            <AppLogo app={action.app} textClassName="text-16" />
          </div>
        )}
      </div>
      <div className="w-full max-w-[490px]  mx-auto">
        <div
          className={cn(styles.container.shadowBox, "grid gap-y-8 py-12 px-20")}
        >
          <div className="grid gap-y-3">
            <h1 className="font-sora font-semibold text-26 text-neutral-dark text-center leading-8">
              Welcome to World ID
            </h1>
            <p className="text-16 text-neutral text-center leading-5">
              Verify you are a unique human with World ID
            </p>
          </div>

          {pageError && <HostedError error={pageError} />}

          {!pageError && actionLoading && (
            <div className="flex justify-center align-middle mt-12">
              <Preloader className="w-20 h-20" />
            </div>
          )}

          {!pageError && !actionLoading && (
            <Fragment>
              <div className="grid gap-y-6">
                {action?.public_description && (
                  <div className="grid grid-cols-1fr/auto gap-3 items-center px-4 py-2 text-14 text-777e90 leading-5 border border-neutral-muted rounded-xl">
                    {action?.public_description}
                    <Icon name="help" className="w-6 h-6 mr-1" noMask />
                  </div>
                )}
                <div className="grid justify-center">
                  {action?.id && logic.props.signal && (
                    <WorldIDWidget
                      signal={logic.props.signal}
                      actionId={action.id}
                      onSuccess={handleSuccess}
                      onError={handleError}
                    />
                  )}
                </div>
              </div>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={!verifiedProof?.success}
                onClick={() => {
                  if (verifiedProof?.return_url) {
                    window.location.href = verifiedProof?.return_url;
                  }
                }}
              >
                Continue{returnUrlDomain && ` to ${returnUrlDomain}`}
              </Button>
              {action?.is_staging && (
                <div className="grid grid-flow-col justify-between items-center">
                  <div
                    className={cn(
                      "text-edbd14 grid grid-cols-auto/1fr items-center gap-x-2",
                      "bg-edbd14/10 border border-edbd14/50 rounded-xl py-2.5 px-4"
                    )}
                  >
                    <Icon name="chart" className="h-6 w-6" />
                    <span>Staging</span>
                  </div>

                  <Link
                    href="https://simulator.worldcoin.org/"
                    external
                    className="hover:opacity-70 transition-opacity grid grid-cols-1fr/auto font-medium"
                  >
                    <span>Scan with Simulator</span>
                    <Icon name="angle-down" className="w-6 h-6 -rotate-90" />
                  </Link>
                </div>
              )}
            </Fragment>
          )}
        </div>
        {pageError && (
          <div className="pt-4 px-20 text-14 text-777e90 text-center leading-5">
            If you&apos;re the owner of this action, check{" "}
            <Link
              // FIXME actual docs link
              href="https://id.worldcoin.org/docs"
              external
            >
              the docs
            </Link>{" "}
            for this World ID hosted page.
          </div>
        )}
      </div>
      <div className="p-8 text-14 text-777e90 leading-5">
        Learn more about{" "}
        <Link href="https://id.worldcoin.org/docs" external rel="noopener">
          World ID
        </Link>{" "}
        and about{" "}
        <Link href="https://worldcoin.org" external rel="noopener">
          Worldcoin
        </Link>
        .
      </div>
    </div>
  );
}
