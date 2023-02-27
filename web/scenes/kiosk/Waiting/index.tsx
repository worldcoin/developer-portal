import { ErrorCodes } from "@worldcoin/idkit/build/types";
import cn from "classnames";
import { Icon } from "common/Icon";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { getKioskStore, Screen, useKioskStore } from "../store/kiosk-store";

export const Waiting = memo(function Waiting() {
  const { setScreen } = useKioskStore(getKioskStore);

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

  //FIXME: Add connection logic
  // useEffect(() => {
  //   import("@walletconnect/client").then(async ({ default: WalletConnect }) => {
  //     const connector = new WalletConnect({
  //       bridge: "https://bridge.walletconnect.org",
  //       clientMeta: {
  //         description: "World ID Kiosk",
  //         url: "https://id.worldcoin.org/docs/",
  //         icons: ["https://id.worldcoin.org/img/logomark.svg"],
  //         name: "World ID Kiosk",
  //       },
  //     });

  //     try {
  //       if (connector.connected) {
  //         await connector.killSession();
  //       }

  //       connector.on("session_update", (error, _payload) => {
  //         if (error) throw error;
  //       });

  //       connector.on("disconnect", (error, _payload) => {
  //         if (error) throw error;
  //       });

  //       await connector.createSession();

  //       // Session has been created
  //       const url = utils.buildQRData(connector);

  //       setQrData(url.toString());

  //       await new Promise<void>((resolve, reject) => {
  //         connector.on("connect", (err) => (err ? reject(err) : resolve()));
  //       });

  //       // Connection has been established
  //       props.setScreen(Screen.Connected);

  //       const verificationResponse = await connector.sendCustomRequest(
  //         utils.buildVerificationRequest({
  //           action_id: props.action.id,
  //           signal: props.signal,
  //           on_success: () => null,
  //         })
  //       );

  //       props.verifyProof({
  //         verificationResponse,
  //         action_id: props.action.id,
  //         signal: props.signal,
  //       });
  //     } catch (error) {
  //       // Unhandled error ocurred (if proof verification fails, it's properly handled by `kioskLogic`)
  //       const errorMessage = (error as ExpectedErrorResponse).message;

  //       if (errorMessage === ErrorCodes.AlreadySigned) {
  //         return props.setScreen("alreadyVerified");
  //       }

  //       if (errorMessage === ErrorCodes.VerificationRejected) {
  //         return props.setScreen("verificationRejected");
  //       }

  //       props.setScreen("connectionError");
  //     } finally {
  //       if (connector?.connected)
  //         connector.killSession().catch(console.error.bind(console));
  //     }
  //   });
  // }, [props]);

  return (
    <div className="flex flex-col items-center portrait:py-12 landscape:py-6">
      <div className="flex items-center gap-x-6 mb-8 font-rubik font-medium text-16 leading-5">
        <Icon name="spinner" className="w-5 h-5 animate-spin" noMask />
        Waiting for user to scan code with Worldcoin app
      </div>
      <div
        className={cn(
          "flex items-center justify-center relative border border-primary/10 rounded-sm",
          "portrait:w-[395px] landscape:w-[299px] portrait:h-[395px] landscape:h-[299px]",
          "before:absolute before:-top-[1px] before:left-[40px] before:right-[40px] before:-bottom-[1px] before:bg-ffffff",
          "after:absolute after:top-[40px] after:-left-[1px] after:-right-[1px] after:bottom-[40px] after:bg-ffffff"
        )}
      >
        <div className="z-10 w-full h-full max-w-full max-h-full bg-ffffff" />
      </div>
      <button className="h-9 portrait:mt-8 landscape:mt-4 px-4 font-rubik font-medium text-14 bg-f3f4f5 rounded-lg">
        Copy QR code
      </button>
    </div>
  );
});
