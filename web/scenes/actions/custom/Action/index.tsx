import {
  Fragment,
  memo,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useMemo,
} from "react";

import { CustomAction } from "common/Layout/temp-data";
import { Disclosure, Transition } from "@headlessui/react";
import { ActionHeader } from "./ActionHeader";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Icon } from "common/Icon";
import { Switch } from "common/Switch";
import { useToggle } from "common/hooks";

dayjs.extend(relativeTime);

const COLORS = [
  {
    background: "#FCEDF4",
    text: "#E0418B",
  },
  {
    background: "#EDFCEF",
    text: "#41E051",
  },
  {
    background: "#EDF1FC",
    text: "#4166E0",
  },
  {
    background: "#FFF5F7",
    text: "#FF5A76",
  },
];

export const Action = memo(function Action(props: { action: CustomAction }) {
  const kiosk = useToggle(false);

  const getTimeFromNow = (timestamp: string) => {
    const result = dayjs(timestamp).fromNow().split(" ");
    const value = result[0] === "a" ? "1" : result[0];
    const timespan = result[1].includes("minute") ? "min" : result[1][0];
    return `${value}${timespan} ago`;
  };

  const randomColors = useMemo(
    () =>
      new Array(props.action.nullifiers.length)
        .fill(null)
        .map(() => COLORS[Math.floor(Math.random() * COLORS.length)]),
    [props.action.nullifiers.length]
  );

  //TODO: Add enabling kiosk logic
  const toggleKiosk = useCallback(() => {
    if (kiosk.isOn) {
      return kiosk.toggleOff();
    }

    kiosk.toggleOn();
  }, [kiosk]);

  return (
    <Disclosure>
      {({ open }) => (
        <Fragment>
          <Disclosure.Button className="shadow-[0px_10px_30px_rgba(25,28,32,0.1)] rounded-xl overflow-y-clip outline-none">
            <ActionHeader action={props.action} open={open} />

            <Transition
              enter="transition-[max-height] duration-300 ease-in"
              enterFrom="max-h-0"
              enterTo="max-h-[1000px]"
              leave="transition-[max-height] duration-300 ease-out"
              leaveFrom="max-h-[1000px]"
              leaveTo="max-h-0"
            >
              <Disclosure.Panel
                onClick={(e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
                  e.stopPropagation();
                }}
                className="text-gray-500 grid border-t border-f3f4f5 pt-4 px-6 pb-6 cursor-auto select-text"
              >
                <div className="grid justify-start justify-items-start">
                  <span className="font-medium text-14">
                    List of verified unique humans
                  </span>

                  <span className="text-14 text-neutral-secondary">
                    World ID
                  </span>
                </div>

                <div className="grid gap-y-6 mt-6">
                  {props.action.nullifiers.length > 0 &&
                    props.action.nullifiers.map((nullifier, index) => (
                      <div
                        className="flex justify-between items-center"
                        key={nullifier.id}
                      >
                        <div className="grid grid-cols-auto/1fr gap-x-3 items-center">
                          <div
                            className="w-11 h-11 relative  rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: randomColors[index].background,
                            }}
                          >
                            <span
                              className="font-sora font-semibold"
                              style={{ color: randomColors[index].text }}
                            >
                              {nullifier.nullifier_hash.slice(0, 2)}
                            </span>

                            <Icon
                              name="badge-nullifier"
                              className="w-3.5 h-3.5 absolute bottom-0 right-0"
                              noMask
                            />
                          </div>

                          <span className="sora text-12">
                            {nullifier.nullifier_hash}
                          </span>
                        </div>

                        <div className="grid grid-flow-col justify-end gap-x-16">
                          <span className="font-sora text-12 font-semibold">
                            #{index + 1}
                          </span>

                          <span className="font-sora text-12 text-neutral-secondary min-w-[8ch] text-end">
                            {getTimeFromNow(nullifier.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}

                  {props.action.nullifiers.length === 0 && (
                    <div className="text-14 text-neutral-secondary">
                      No one has verified yet
                    </div>
                  )}

                  <div className="-mx-6 border-t border-f3f4f5 pt-6">
                    <div className="grid gap-x-2 grid-flow-col items-center justify-end px-6">
                      <span className="text-14">Enable Kiosk</span>
                      <Switch checked={kiosk.isOn} toggle={toggleKiosk} />
                    </div>
                  </div>
                </div>
              </Disclosure.Panel>
            </Transition>
          </Disclosure.Button>
        </Fragment>
      )}
    </Disclosure>
  );
});
