import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "common/Icon";
import cn from "classnames";
import { kioskLogic } from "../kioskLogic";
import { Field } from "scenes/action/ActionCard/Field";
import { ModelPublicAction } from "types";
import { Link } from "common/Link";
import { ErrorCodes, ExpectedErrorResponse, utils } from "@worldcoin/id";
import { Spinner } from "common/Spinner";

export const Waiting = memo(function Waiting(props: {
  signal: string;
  action: Required<ModelPublicAction>;
  setScreen: (screen: string) => void;
  verifyProof: typeof kioskLogic.actions.verifyProof;
}) {
  const [copied, setCopied] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);

  const qrReference = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!qrReference.current || !qrData) {
      return;
    }

    const QRElement = qrReference.current;

    import("qr-code-styling").then((mod) => {
      const qr = new mod.default({
        backgroundOptions: { color: "transparent" },
        cornersDotOptions: { type: "dot" },
        cornersSquareOptions: { type: "extra-rounded" },
        data: qrData,
        dotsOptions: { color: "currentColor", type: "dots" },
        height: QRElement.offsetWidth,
        image: "/icons/worldcoin-small-color.svg",
        imageOptions: { margin: 4 },
        type: "svg",
        width: QRElement.offsetWidth,
      });

      QRElement.innerHTML = "";
      qr.append(QRElement);
    });
  }, [qrData]);

  const handleCopy = useCallback(() => {
    if (!qrData) return;

    navigator.clipboard
      .writeText(qrData)
      .then(() => setCopied(true))
      .then(() => new Promise((resolve) => setTimeout(resolve, 3000)))
      .finally(() => setCopied(false));
  }, [qrData]);

  useEffect(() => {
    import("@walletconnect/client").then(async ({ default: WalletConnect }) => {
      const connector = new WalletConnect({
        bridge: "https://bridge.walletconnect.org",
        clientMeta: {
          description: "World ID Kiosk",
          url: "https://id.worldcoin.org/docs/",
          icons: ["https://id.worldcoin.org/img/logomark.svg"],
          name: "World ID Kiosk",
        },
      });

      try {
        if (connector.connected) {
          await connector.killSession();
        }

        connector.on("session_update", (error, _payload) => {
          if (error) throw error;
        });

        connector.on("disconnect", (error, _payload) => {
          if (error) throw error;
        });

        await connector.createSession();

        // Session has been created
        const url = utils.buildQRData(connector);

        setQrData(url.toString());

        await new Promise<void>((resolve, reject) => {
          connector.on("connect", (err) => (err ? reject(err) : resolve()));
        });

        // Connection has been established
        props.setScreen("connected");

        const verificationResponse = await connector.sendCustomRequest(
          utils.buildVerificationRequest({
            action_id: props.action.id,
            signal: props.signal,
            on_success: () => null,
          })
        );

        props.verifyProof({
          verificationResponse,
          action_id: props.action.id,
          signal: props.signal,
        });
      } catch (error) {
        // Unhandled error ocurred (if proof verification fails, it's properly handled by `kioskLogic`)
        const errorMessage = (error as ExpectedErrorResponse).message;

        if (errorMessage === ErrorCodes.AlreadySigned) {
          return props.setScreen("alreadyVerified");
        }

        if (errorMessage === ErrorCodes.VerificationRejected) {
          return props.setScreen("verificationRejected");
        }

        props.setScreen("connectionError");
      } finally {
        if (connector?.connected)
          connector.killSession().catch(console.error.bind(console));
      }
    });
  }, [props]);

  return (
    <div className="grid justify-items-center gap-y-8">
      <div className="grid items-center grid-flow-col auto-cols-max gap-x-6">
        <Spinner />
        <p>Waiting for user to scan code with Worldcoin app</p>
      </div>

      <div
        className={cn(
          "relative p-5 w-[395px] h-[395px] border-[1.45px] border-primary/10 dark:border-none",
          "after:absolute after:-inset-0.5 after:bg-[#ffffff] dark:after:opacity-0",
          `after:[clip-path:polygon(0_50px,_50px_0,_calc(100%_-_50px)_0%,_100%_50px,_100%_calc(100%_-_50px),_calc(100%_-_50px)_100%,_50px_100%,_0_calc(100%_-_50px))]`
        )}
      >
        <div className="relative z-10" ref={qrReference} />
      </div>

      <button
        className={cn(
          "grid grid-flow-col auto-cols-min whitespace-nowrap gap-x-1.5 items-center text-[14px] leading-[1.2]",
          "text-neutral dark:text-ffffff rounded-full px-[15px] py-[13.5px] bg-[#f1f2f2] dark:bg-[transparent]"
        )}
        onClick={handleCopy}
      >
        {copied ? (
          <Fragment>
            <span className="relative p-2 rounded-full whitespace-nowrap bg-success">
              <Icon
                className="absolute z-10 inset-1 text-ffffff"
                name="check"
              />
            </span>
            Copied!
          </Fragment>
        ) : (
          "Copy QR code"
        )}
      </button>

      {props.action.is_staging && (
        <div className="grid items-center grid-flow-col gap-x-8">
          <Field
            fieldClassName="!bg-[#edbd14]/10 border-[#edbd14]/50 text-[#edbd14]"
            icon="chart"
            name={""}
            value={"Staging"}
          />

          <Link
            className={cn(
              "grid items-center grid-flow-col transition-opacity auto-cols-max"
            )}
            external
            href="https://simulator.worldcoin.org/"
          >
            Scan with Simulator{" "}
            <Icon className="w-6 h-6 -rotate-90" name="angle-down" />
          </Link>
        </div>
      )}
    </div>
  );
});
