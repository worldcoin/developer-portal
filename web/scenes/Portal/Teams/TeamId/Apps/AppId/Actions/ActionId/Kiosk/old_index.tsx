// import { KioskProps } from "@/pages/team/[team_id]/kiosk/[action_id]";
// import { ISuccessResult } from "@worldcoin/idkit-core";
// import clsx from "clsx";
// import dayjs from "dayjs";
// import Image from "next/image";
// import { useRouter } from "next/router";
// import { memo, useCallback, useEffect } from "react";

// type ProofResponse = {
//   success: boolean;
//   action_id?: string;
//   nullifier_hash?: string;
//   created_at?: string;
//   code?: string;
//   detail?: string;
//   attribute?: string;
// };

// const getKioskStoreParams = (store: IKioskStore) => ({
//   setScreen: store.setScreen,
//   screen: store.screen,
//   kioskAction: store.kioskAction,
//   setKioskAction: store.setKioskAction,
//   setSuccessParams: store.setSuccessParams,
//   proofResult: store.proofResult,
//   successParams: store.successParams,
// });

// export const Kiosk = memo(function Kiosk({ action, error_code }: KioskProps) {
//   const router = useRouter();
//   const {
//     kioskAction,
//     screen,
//     setScreen,
//     setKioskAction,
//     proofResult,
//     setSuccessParams,
//     successParams,
//   } = useKioskStore(getKioskStoreParams);

//   useEffect(() => {
//     if (action && !kioskAction) {
//       setKioskAction(action);
//     } else if (!kioskAction) {
//       setScreen(KioskScreen.InvalidRequest);
//     }
//   }, [action, setKioskAction, setScreen, kioskAction]);

//   const handleClickBack = useCallback(() => {
//     router.push("/"); // FIXME: define back url
//   }, [router]);

//   const verifyProof = useCallback(
//     async (result: ISuccessResult) => {
//       let response;
//       try {
//         response = await restAPIRequest<ProofResponse>(
//           `/verify/${kioskAction?.app.id}`,
//           {
//             method: "POST",
//             json: { action: kioskAction?.action, signal: "", ...result },
//           },
//         );
//       } catch (e) {
//         console.warn("Error verifying proof. Please check network logs.");
//         try {
//           if ((e as Record<string, any>).code) {
//             response = {
//               success: false,
//               code: (e as Record<string, any>).code,
//             };
//           }
//         } catch {
//           response = { success: false, code: "unknown" };
//         }
//       }

//       if (response?.success) {
//         setSuccessParams({
//           timestamp: dayjs(response.created_at),
//           confirmationCode:
//             response.nullifier_hash?.slice(-5).toLocaleUpperCase() ?? "",
//         });

//         setScreen(KioskScreen.Success);
//       } else {
//         if (response?.code === "max_verifications_reached") {
//           setScreen(KioskScreen.AlreadyVerified);
//         } else if (response?.code === "invalid_merkle_root") {
//           setScreen(KioskScreen.InvalidIdentity);
//         } else {
//           setScreen(KioskScreen.VerificationError);
//         }
//       }
//     },
//     [kioskAction, setScreen, setSuccessParams],
//   );

//   useEffect(() => {
//     if (proofResult && !successParams) {
//       verifyProof(proofResult);
//     }
//   }, [proofResult, verifyProof, successParams]);

//   return (
//     <div className={clsx("fixed inset-0 grid w-full justify-center bg-white")}>
//       <div className="grid h-[100dvh] w-[100dvw] grid-rows-auto/1fr">
//         <header className="relative flex h-[86px] shrink-0 items-center justify-center">
//           <div className="absolute inset-y-0 left-0 flex items-center pl-4">
//             <button
//               className="flex size-9 items-center justify-center rounded-full bg-[#ebecef]"
//               onClick={handleClickBack}
//             >
//               {/* FIXME: Add default logo */}
//               <Icon name="arrow-left" className="size-6" />
//             </button>
//           </div>

//           <div className="flex justify-center">
//             <Icon name="logo" className="h-6 w-[142px]" />
//           </div>
//           {/* FIXME: This will be removed later so just fixing for type check */}
//           <div className="absolute inset-y-0 right-0 flex items-center gap-x-4 pr-6">
//             <div className="font-rubik text-14 font-medium">
//               {kioskAction?.app.app_metadata?.name}
//             </div>
//             {kioskAction?.app.app_metadata?.logo_img_url && (
//               <Image
//                 src={kioskAction?.app.app_metadata?.logo_img_url ?? ""}
//                 alt="logo"
//                 width={200}
//                 height={200}
//                 className="size-11 rounded-full"
//               />
//             )}
//           </div>
//         </header>

//         <div className="grid grow grid-rows-auto/1fr/auto items-center justify-center portrait:py-12 landscape:py-4">
//           <div className="mb-8 flex flex-col items-center">
//             <h1 className="font-sora text-32 font-semibold leading-10">
//               World ID Kiosk Verification
//             </h1>

//             {kioskAction?.description && (
//               <div className="bg-primary grid max-w-[400px] grid-cols-auto/1fr items-center rounded-2xl p-4 portrait:mt-12 landscape:mt-6">
//                 <div className="text-ffffff font-rubik text-16 leading-5">
//                   {kioskAction.description}
//                 </div>
//               </div>
//             )}
//           </div>

//           {(!kioskAction || error_code) && (
//             <KioskError
//               title="This request is invalid."
//               error_code={error_code}
//             />
//           )}

//           {kioskAction && (
//             <IDKitBridge
//               app_id={kioskAction.app.id}
//               action={kioskAction.action}
//               action_description={kioskAction.description}
//             />
//           )}

//           {screen === KioskScreen.Waiting && <Waiting />}
//           {screen === KioskScreen.Connected && <Connected />}
//           {screen === KioskScreen.Success && <Success />}

//           {screen === KioskScreen.ConnectionError && (
//             <KioskError
//               title="Connection Error"
//               description="We cannot establish a connection to the person's World App. Please refresh and try again."
//               buttonText="Retry"
//             />
//           )}

//           {screen === KioskScreen.AlreadyVerified && (
//             <KioskError
//               title="Already Verified"
//               description="This person has already verified for this action."
//               buttonText="New verification"
//             />
//           )}

//           {screen === KioskScreen.VerificationRejected && (
//             <KioskError
//               title="Verification Rejected"
//               description="Person rejected the verification in the World App."
//               buttonText="Try again"
//             />
//           )}

//           {screen === KioskScreen.InvalidIdentity && (
//             <KioskError
//               title="Not verified"
//               description="Person is not verified with World ID. They can visit an orb to verify."
//               buttonText="New verification"
//             />
//           )}

//           {screen === KioskScreen.VerificationError && (
//             <KioskError
//               title="Verification Error"
//               description="We couldn't verify this person. Please try again."
//               buttonText="Retry"
//             />
//           )}

//           {/* TODO: Implement for authenticated users */}
//           {/* {actions.length > 0 && currentAction && (
//           <div className="flex flex-col items-center gap-y-2">
//             <div className="font-rubik font-medium text-16 leading-5">
//               Choose Action
//             </div>

//             <ActionSelect
//               value={currentAction}
//               onChange={handleActionChange}
//               options={actions}
//             />
//           </div>
//         )} */}
//         </div>
//       </div>
//     </div>
//   );
// });
