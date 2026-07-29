import { FormDialog } from "@/components/FormDialog";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { CheckmarkCircleIcon } from "@/components/Icons/CheckmarkCircleIcon";
import { CollapseIcon } from "@/components/Icons/CollapseIcon";
import { ExpandIcon } from "@/components/Icons/ExpandIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Disclosure } from "@headlessui/react";
import clsx from "clsx";
import { atom, useAtom } from "jotai";

export const permissionsDialogAtom = atom(false);

type PermissionsConfig = Record<
  string,
  Record<keyof typeof Role_Enum, boolean>
>;

const config: PermissionsConfig = {
  "Create Incognito Actions": {
    Owner: true,
    Admin: true,
    Member: true,
  },
  "Edit Incognito Actions": {
    Owner: true,
    Admin: true,
    Member: false,
  },
  "Delete incognito actions": {
    Owner: true,
    Admin: true,
    Member: false,
  },
  "View Sign in with World ID": {
    Owner: true,
    Admin: true,
    Member: true,
  },
  "Create & Edit Sign in with World ID": {
    Owner: true,
    Admin: true,
    Member: false,
  },
  "View apps": {
    Owner: true,
    Admin: true,
    Member: true,
  },
  "Create & Edit apps": {
    Owner: true,
    Admin: true,
    Member: false,
  },
  "Delete apps": {
    Owner: true,
    Admin: false,
    Member: false,
  },
  "View app configuration": {
    Owner: true,
    Admin: true,
    Member: true,
  },
  "Create & Edit app configuration": {
    Owner: true,
    Admin: true,
    Member: false,
  },
  "View API keys": {
    Owner: true,
    Admin: true,
    Member: false,
  },
  "Create & Edit API keys": {
    Owner: true,
    Admin: false,
    Member: false,
  },
  "Delete API keys": {
    Owner: true,
    Admin: false,
    Member: false,
  },
  "View team members & roles": {
    Owner: true,
    Admin: true,
    Member: true,
  },
  "Invite team members": {
    Owner: true,
    Admin: true,
    Member: false,
  },
  "Remove team members": {
    Owner: true,
    Admin: false,
    Member: false,
  },
  "Update team roles": {
    Owner: true,
    Admin: false,
    Member: false,
  },
};

export const PermissionsDialog = () => {
  const [isOpened, setIsOpened] = useAtom(permissionsDialogAtom);

  return (
    <FormDialog
      open={isOpened}
      onClose={() => setIsOpened(false)}
      title="Permissions list"
      closeLabel="Close permissions list"
      dialogClassName="z-50 px-4"
      panelClassName="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2.5rem)] md:w-[1056px]"
      bodyClassName="min-h-0 overflow-y-auto"
    >
      <div className="hidden md:grid">
        <div className="mb-3 grid grid-cols-4 items-center justify-items-center">
          <span />

          <Typography variant={TYPOGRAPHY.M4}>Owner</Typography>
          <Typography variant={TYPOGRAPHY.M4}>Admin</Typography>
          <Typography variant={TYPOGRAPHY.M4}>Member</Typography>
        </div>

        {Object.entries(config).map(([permission, roles], index) => (
          <div
            className={clsx(
              "grid grid-cols-4 items-center justify-items-center rounded-8",
              { "bg-grey-50": index % 2 === 0 },
            )}
            key={permission}
          >
            <Typography
              variant={TYPOGRAPHY.R4}
              className="w-full py-3 pl-4 text-start text-grey-500"
            >
              {permission}
            </Typography>

            {Object.entries(roles).map(([role, isAllowed]) => (
              <Typography key={role} variant={TYPOGRAPHY.R4} className="">
                {isAllowed ? (
                  <CheckmarkCircleIcon className="text-system-success-500" />
                ) : (
                  ""
                )}
              </Typography>
            ))}
          </div>
        ))}
      </div>

      <div className="grid w-full gap-y-3 font-world md:hidden">
        {["Owner", "Admin", "Member"].map((role, index) => (
          <Disclosure key={index}>
            {({ open }) => (
              <div className="rounded-8 border border-grey-200">
                <Disclosure.Button className="flex w-full justify-between px-4 py-3 text-14 leading-5 font-medium">
                  {role}

                  {open ? <CollapseIcon /> : <ExpandIcon />}
                </Disclosure.Button>

                <Disclosure.Panel className="grid gap-y-3 px-4 pb-4">
                  {Object.entries(config)
                    .filter(
                      ([_, roles]) => !!roles[role as keyof typeof Role_Enum],
                    )
                    .map(([permission], index) => (
                      <div
                        key={index}
                        className="flex gap-x-2 text-13 leading-5"
                      >
                        <CheckIcon
                          className="text-system-success-500"
                          size="16"
                        />

                        {permission}
                      </div>
                    ))}
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </FormDialog>
  );
};
