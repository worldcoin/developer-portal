import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { CheckmarkCircleIcon } from "@/components/Icons/CheckmarkCircleIcon";
import { CollapseIcon } from "@/components/Icons/CollapseIcon";
import { ExpandIcon } from "@/components/Icons/ExpandIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  PERMISSION_DISPLAY_GROUPS,
  TEAM_PERMISSION_ROLES,
  roleHasPermission,
} from "@/lib/team-permissions";
import { Disclosure } from "@headlessui/react";
import clsx from "clsx";
import { atom, useAtom } from "jotai";

export const permissionsDialogAtom = atom(false);

export const PermissionsDialog = () => {
  const [isOpened, setIsOpened] = useAtom(permissionsDialogAtom);

  return (
    <Dialog
      open={isOpened}
      onClose={() => setIsOpened(false)}
      as="div"
      className="z-50 px-4"
    >
      <DialogOverlay />

      <DialogPanel className="grid gap-y-8 md:max-w-[66rem]">
        <header className="flex w-full items-center justify-start">
          <Button
            type="button"
            onClick={() => setIsOpened(false)}
            className="flex size-8 items-center justify-center rounded-full bg-grey-100"
          >
            <ArrowRightIcon className="rotate-180" />
          </Button>

          <Typography
            variant={TYPOGRAPHY.H6}
            className="w-full pr-8 text-center md:hidden"
          >
            Permissions list
          </Typography>
        </header>

        <div className="hidden md:grid">
          <div className="mb-5 grid grid-cols-4 items-center justify-items-center">
            <Typography variant={TYPOGRAPHY.H6} className="w-full text-start">
              Permissions list
            </Typography>

            {TEAM_PERMISSION_ROLES.map((role) => (
              <Typography key={role.value} variant={TYPOGRAPHY.M4}>
                {role.label}
              </Typography>
            ))}
          </div>

          {PERMISSION_DISPLAY_GROUPS.map((permission, index) => (
            <div
              className={clsx(
                "grid grid-cols-4 items-center justify-items-center rounded-lg",
                { "bg-grey-100": index % 2 === 0 },
              )}
              key={permission.label}
            >
              <Typography
                variant={TYPOGRAPHY.R4}
                className="w-full py-3 pl-5 text-start text-grey-500"
              >
                {permission.label}
              </Typography>

              {TEAM_PERMISSION_ROLES.map((role) => (
                <Typography
                  key={role.value}
                  variant={TYPOGRAPHY.R4}
                  className=""
                >
                  {roleHasPermission(permission, role.value) ? (
                    <CheckmarkCircleIcon className="text-system-success-500" />
                  ) : (
                    ""
                  )}
                </Typography>
              ))}
            </div>
          ))}
        </div>

        <div className="grid w-full gap-y-4 font-gta md:hidden">
          {TEAM_PERMISSION_ROLES.map((role) => (
            <Disclosure key={role.value}>
              {({ open }) => (
                <div className="rounded-16 border border-grey-200">
                  <Disclosure.Button className="flex w-full justify-between px-5 py-4 text-18 font-medium leading-6">
                    {role.label}

                    {open ? <CollapseIcon /> : <ExpandIcon />}
                  </Disclosure.Button>

                  <Disclosure.Panel className="grid gap-y-4 px-5 pb-4">
                    {PERMISSION_DISPLAY_GROUPS.filter((permission) =>
                      roleHasPermission(permission, role.value),
                    ).map((permission, index) => (
                      <div
                        key={index}
                        className="flex gap-x-2 text-14 leading-5"
                      >
                        <CheckIcon
                          className="text-system-success-500"
                          size="16"
                        />

                        {permission.label}
                      </div>
                    ))}
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          ))}
        </div>
      </DialogPanel>
    </Dialog>
  );
};
