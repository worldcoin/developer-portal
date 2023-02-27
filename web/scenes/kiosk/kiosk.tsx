import cn from "classnames";
import { Icon } from "common/Icon";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { ActionSelect } from "scenes/kiosk/Waiting/ActionSelect";

export function Kiosk() {
  const router = useRouter();

  const handleClickBack = useCallback(() => {
    router.push("/"); // FIXME: define back url
  }, [router]);

  const [action, setAction] = useState<
    { id: string; name: string } | undefined
  >();

  useEffect(() => {
    // FIXME: load action
    setAction({ id: "2", name: "Custom Action 02" });
  }, [router.query.action_id]);

  const [actions, setActions] = useState<
    Array<{ id: string; name: string }> | undefined
  >();

  useEffect(() => {
    // FIXME: load actions
    setActions([
      { id: "1", name: "Custom Action 01" },
      { id: "2", name: "Custom Action 02" },
      { id: "3", name: "Custom Action 03" },
    ]);
  }, [router.query.action_id]);

  return (
    <div className="flex flex-col h-screen">
      <header className="relative shrink-0 flex items-center justify-center h-[86px]">
        <div className="absolute top-0 bottom-0 left-0 flex items-center pl-4">
          <button
            className="flex items-center justify-center w-9 h-9 bg-ebecef rounded-full"
            onClick={handleClickBack}
          >
            <Icon name="arrow-left" className="w-6 h-6" />
          </button>
        </div>

        <div className="flex justify-center">
          <Icon name="logo" className="w-[142px] h-6" />
        </div>
        <div className="absolute top-0 bottom-0 right-0 flex items-center gap-x-4 pr-6">
          <div className="font-rubik font-medium text-14">App Name</div>
          <div className="w-11 h-11 rounded-full bg-edecfc" />
        </div>
      </header>

      <div className="grow grid grid-rows-auto/1fr/auto items-center justify-center portrait:py-12 landscape:py-4">
        <div className="flex flex-col items-center">
          <h1 className="font-sora font-semibold text-32 leading-10">
            World ID Kiosk Verification
          </h1>
          <div className="max-w-[400px] portrait:mt-12 landscape:mt-6 grid grid-cols-auto/1fr items-center gap-x-3 p-4 bg-primary rounded-2xl">
            <div className="w-9 h-9 rounded-full bg-edecfc" />
            <div className="font-rubik text-16 text-ffffff leading-5">
              Attending the ETH NY conference as a participant on June 2022.
            </div>
          </div>
        </div>

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
            <div className="z-10 w-full h-full max-w-full max-h-full bg-neutral-secondary" />
          </div>
          <button className="h-9 portrait:mt-8 landscape:mt-4 px-4 font-rubik font-medium text-14 bg-f3f4f5 rounded-lg">
            Copy QR code
          </button>
        </div>

        <div className="flex flex-col items-center gap-y-2">
          <div className="font-rubik font-medium text-16 leading-5">
            Choose Action
          </div>
          <ActionSelect value={action} onChange={setAction} options={actions} />
        </div>
      </div>
    </div>
  );
}
