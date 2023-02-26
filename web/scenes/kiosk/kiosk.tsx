import { useActions, useValues } from "kea";
//import { authLogic } from "logics/authLogic";
//import { useRouter } from "next/router";
//import { useEffect, useMemo } from "react";
//import { urls } from "urls";
//import { KioskError } from "./common/KioskError";
//import { Connected } from "./Connected";
//import { Intro } from "./Intro";
import { kioskLogic } from "./kioskLogic";
//import { Layout } from "./Layout";
//import { Success } from "./Success";
//import { Waiting } from "./Waiting";

import cn from 'classnames'
import {Icon} from 'common/Icon'
import {useRouter} from 'next/router'
import {useCallback, useEffect, useState} from 'react'
import {ActionSelect} from 'scenes/kiosk/Waiting/ActionSelect'

export function Kiosk() {

  const router = useRouter();

  const handleClickBack = useCallback(() => {
    router.push('/'); // FIXME: define back url
  }, [router]);

  const [action, setAction] = useState<{ id:string, name:string } | undefined>();

  useEffect(() => {
    // FIXME: load action
    setAction({ id: '2', name: 'Custom Action 02'});
  }, [router.query.action_id]);

  const [actions, setActions] = useState<Array<{ id:string, name:string }> | undefined>();

  useEffect(() => {
    // FIXME: load actions
    setActions([
      { id: '1', name: 'Custom Action 01'},
      { id: '2', name: 'Custom Action 02'}
    ]);
  }, [router.query.action_id]);

  return (
    <div
      className="flex flex-col h-screen"
    >
      <header className="relative shrink-0 flex items-center justify-center h-[86px]">
        <div className="absolute top-0 bottom-0 left-0 flex items-center pl-4">
          <button className="flex items-center justify-center w-9 h-9 bg-ebecef rounded-full" onClick={handleClickBack}>
            <Icon name="arrow-left" className="w-6 h-6"/>
          </button>
        </div>

        <div className="flex justify-center">
          <Icon name="logo" className="w-[142px] h-6"/>
        </div>
        <div className="absolute top-0 bottom-0 right-0 flex items-center gap-x-4 pr-6">
          <div className="font-rubik font-medium text-14">App Name</div>
          <div className="w-11 h-11 rounded-full bg-edecfc"/>
        </div>
      </header>

      <div className="grow grid grid-rows-auto/1fr/auto items-center justify-center py-12">
        <div className="flex flex-col items-center">
          <h1 className="font-sora font-semibold text-32 leading-10">
            World ID Kiosk Verification
          </h1>
          <div className="max-w-[400px] mt-12 grid grid-cols-auto/1fr items-center gap-x-3 p-4 bg-primary rounded-2xl">
            <div className="w-9 h-9 rounded-full bg-edecfc"/>
            <div className="font-rubik text-16 text-ffffff leading-5">
              Attending the ETH NY conference as a participant on June 2022.
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center py-12">
          <div className="flex items-center gap-x-6 mb-8 font-rubik font-medium text-16 leading-5">
            <Icon name="spinner" className="w-5 h-5 animate-spin" noMask/>
            Waiting for user to scan code with Worldcoin app
          </div>
          <div
            className={cn('flex items-center justify-center relative w-[395px] h-[395px] border border-primary/10 rounded-sm',
              'before:absolute before:-top-[1px] before:left-[40px] before:right-[40px] before:-bottom-[1px] before:bg-ffffff',
              'after:absolute after:top-[40px] after:-left-[1px] after:-right-[1px] after:bottom-[40px] after:bg-ffffff'
            )}
          >
            <div className="max-w-full max-h-full"/>
          </div>
          <button
            className="h-9 mt-8 px-4 font-rubik font-medium text-14 bg-f3f4f5 rounded-lg"
          >
            Copy QR code
          </button>
        </div>

        <div className="flex flex-col items-center gap-y-2">
          <div className="font-rubik font-medium text-16 leading-5">
            Choose Action
          </div>
          <ActionSelect
            value={action}
            onChange={setAction}
            options={actions}
          />
        </div>
      </div>
    </div>
  )
  // const router = useRouter();
  // useEffect(() => {
  //   kioskLogic({
  //     action_id: router.query.action_id?.toString(),
  //   });
  // }, [router.query]);
  // const { action, screen, verifiedProof } = useValues(kioskLogic);
  // const { setScreen, verifyProof } = useActions(kioskLogic);
  // //const { isAuthenticated } = useValues(authLogic);
  //
  // const backUrl = useMemo(() => {
  //   if (!isAuthenticated || !action) return undefined;
  //   return urls.action(action.id);
  // }, [action, isAuthenticated]);
  //
  // return (
  //   <Layout
  //     actionId={kioskLogic.props.action_id}
  //     app={action?.app}
  //     description={action?.public_description}
  //     title="World ID Kiosk Verification"
  //     backUrl={backUrl}
  //   >
  //     {!screen ||
  //       (screen === "intro" && (
  //         <Intro actionId={kioskLogic.props.action_id} setScreen={setScreen} />
  //       ))}
  //
  //     {screen === "waiting" && action !== null && (
  //       <Waiting
  //         setScreen={setScreen}
  //         verifyProof={verifyProof}
  //         action={action}
  //         signal="kioskVerification"
  //       />
  //     )}
  //
  //     {screen === "connected" && <Connected setScreen={setScreen} />}
  //     {screen === "success" && (
  //       <Success
  //         setScreen={setScreen}
  //         confirmationId={verifiedProof?.nullifier_hash?.substring(
  //           verifiedProof?.nullifier_hash?.length - 8,
  //           verifiedProof?.nullifier_hash.length
  //         )}
  //         createdAt={verifiedProof?.created_at}
  //       />
  //     )}
  //
  //     {screen === "connectionError" && (
  //       <KioskError
  //         setScreen={setScreen}
  //         title="Connection Error"
  //         description="We cannot establish a connection to the Worldcoin app. Please refresh and try again."
  //         buttonText="Retry"
  //       />
  //     )}
  //
  //     {screen === "alreadyVerified" && (
  //       <KioskError
  //         setScreen={setScreen}
  //         title="Already verified"
  //         description="This person has already verified for this action."
  //         buttonText="New verification for another user"
  //       />
  //     )}
  //
  //     {screen === "verificationRejected" && (
  //       <KioskError
  //         setScreen={setScreen}
  //         title="Verification rejected"
  //         description="Verification rejected in the Worldcoin app."
  //         buttonText="Try again"
  //       />
  //     )}
  //
  //     {screen === "invalidIdentity" && (
  //       <KioskError
  //         setScreen={setScreen}
  //         title="User is not verified"
  //         description="Looks like this user is not verified with World ID. They can visit an orb to verify."
  //         buttonText="New verification for another user"
  //       />
  //     )}
  //
  //     {screen === "verificationError" && (
  //       <KioskError
  //         setScreen={setScreen}
  //         title="Verification Error"
  //         description="We couldn't verify this user. Please try again."
  //         buttonText="Retry"
  //       />
  //     )}
  //   </Layout>
  // );
}
