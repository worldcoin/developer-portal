import { Disclosure } from "@headlessui/react";
import cn from "classnames";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  Fragment,
  memo,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Icon } from "@/components/Icon";
import { InfoField } from "src/scenes/actions/Action/InfoField";
import { VerificationSelect } from "@/scenes/actions/common/VerificationSelect";
import { Button } from "@/components/Button";
import { Link } from "@/components/Link";
import { urls } from "src/lib/urls";
import { ActionsQuery } from "../graphql/actions.generated";
import { useUpdateAction } from "../hooks";
import { IActionStore, useActionStore } from "src/stores/actionStore";
import { ActionValue } from "../common/ActionValue";

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

const getActionsStore = (store: IActionStore) => ({
  setActionToUpdate: store.setActionToUpdate,
});

export const Action = memo(function Action(props: {
  action: ActionsQuery["action"][number];
}) {
  const { updateAction } = useUpdateAction();
  const { setActionToUpdate } = useActionStore(getActionsStore);

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

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      navigator.clipboard.writeText(props.action.action);
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [copied, props.action.action]);

  const enableKiosk = useCallback(
    (id: string) => (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      updateAction(id, { kiosk_enabled: true });
    },
    [updateAction]
  );

  const disableKiosk = useCallback(
    (id: string) => (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      updateAction(id, { kiosk_enabled: false });
    },
    [updateAction]
  );

  return (
    <Disclosure as={Fragment}>
      {({ open }) => (
        <Fragment>
          <Disclosure.Button
            as="tbody"
            className={cn({
              "bg-f9fafb": open,
            })}
          >
            <tr>
              <td className="pt-2 pl-2 pr-6 rounded-tl-lg whitespace-nowrap">
                <div className="flex items-center gap-x-2">
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-light text-0">
                    <Icon name="notepad" className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex flex-col items-start gap-y-1">
                    <InfoField
                      placeholder="Click to set action name"
                      value={props.action.name}
                      textClassName="max-w-[16ch]"
                      onClick={() => setActionToUpdate(props.action)}
                    />
                    <div className="group flex gap-x-1">
                      <ActionValue value={props.action.action} />

                      <button
                        className="outline-none hover:opacity-80 transition-opacity text-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCopied(true);
                        }}
                      >
                        {!copied && (
                          <Icon
                            name="copy"
                            className="h-4 w-4 text-primary-light group-hover:text-primary"
                          />
                        )}
                        {copied && (
                          <Icon name="check" className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </td>

              <td className="pr-6 whitespace-nowrap">
                <InfoField
                  placeholder="Click to set description"
                  value={props.action.description}
                  textClassName={cn("max-w-[50ch]", {
                    "text-gray-400 ": !props.action.description,
                  })}
                  onClick={() => setActionToUpdate(props.action)}
                />
              </td>

              <td className="pr-4">
                <VerificationSelect
                  hint="Changing this will not retroactively affect already verified users!"
                  value={props.action.max_verifications}
                  onChange={(value) =>
                    updateAction(props.action.id, {
                      max_verifications: value,
                    })
                  }
                />
              </td>

              <td className="pr-4 text-14 text-center whitespace-nowrap">
                {props.action.nullifiers.length}
              </td>

              <td className="pr-2 text-right rounded-tr-lg whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                  <div className="grow flex justify-center">
                    {!props.action.kiosk_enabled && (
                      <Button
                        variant="plain"
                        className="!font-semibold !text-14 !text-primary hover:opacity-70"
                        onClick={enableKiosk(props.action.id)}
                      >
                        Enable Kiosk
                      </Button>
                    )}

                    {props.action.kiosk_enabled && (
                      <Link
                        className="flex items-center gap-x-1 h-8 px-2 font-sora font-semibold text-14 bg-ffffff border border-ebecef rounded-lg hover:opacity-70 transition-opacity"
                        href={urls.kiosk(props.action.id)}
                        target="_blank"
                      >
                        Open Kiosk
                        <Icon name="maximize" className="w-4 h-4" />
                      </Link>
                    )}
                  </div>

                  <Icon
                    name="angle-down"
                    className={cn("h-6 w-6 transition-transform", {
                      "rotate-180": open,
                    })}
                  />
                </div>
              </td>
            </tr>
          </Disclosure.Button>
          <Disclosure.Panel
            as="tbody"
            className={cn({
              "bg-f9fafb": open,
            })}
          >
            {props.action.nullifiers.length === 0 && (
              <Fragment>
                <tr>
                  <td className="rounded-b-lg" colSpan={5}>
                    <div className="mt-10 ml-6 font-medium text-12 text-center leading-3">
                      List of verified unique humans
                    </div>

                    <div className="mt-2 ml-6 mb-3 text-12 text-center text-neutral-secondary leading-3">
                      No one has verified for this action just yet.
                    </div>
                  </td>
                </tr>
              </Fragment>
            )}
            {props.action.nullifiers.length > 0 && (
              <Fragment>
                <tr>
                  <td className="rounded-b-lg" colSpan={5}>
                    <div className="mt-10 ml-6 font-medium text-12 leading-4">
                      List of verified unique humans
                    </div>

                    <div className="mt-2 ml-6 mb-3 text-12 leading-3 text-neutral-secondary">
                      World ID
                    </div>
                  </td>
                </tr>

                {props.action.nullifiers.map((nullifier, index) => (
                  <tr key={nullifier.id}>
                    <td className="pl-6 py-3" colSpan={3}>
                      <div className="flex items-center gap-x-3">
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

                        <div className="font-sora text-12">
                          {nullifier.nullifier_hash}
                        </div>
                      </div>
                    </td>

                    <td className="text-center">
                      <div className="font-sora text-12">#{index + 1}</div>
                    </td>

                    <td className="pr-6 whitespace-nowrap">
                      <div className="font-sora text-12 text-right text-neutral-secondary">
                        {getTimeFromNow(nullifier.created_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </Fragment>
            )}
            <tr>
              <td colSpan={5} className="px-6">
                <div className="flex justify-end pt-4 pb-6 border-t border-f3f4f5">
                  {!props.action.kiosk_enabled && (
                    <Button
                      variant="plain"
                      className="!font-semibold !text-14 !text-primary hover:opacity-70"
                      onClick={enableKiosk(props.action.id)}
                    >
                      Enable Kiosk
                    </Button>
                  )}

                  {props.action.kiosk_enabled && (
                    <Button
                      variant="plain"
                      className="!font-semibold !text-14 !text-ff6848 hover:opacity-70"
                      onClick={disableKiosk(props.action.id)}
                    >
                      Disable Kiosk
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          </Disclosure.Panel>
        </Fragment>
      )}
    </Disclosure>
  );
});
