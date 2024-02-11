import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { CheckmarkCircleIcon } from "@/components/Icons/CheckmarkCircleIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import clsx from "clsx";
import { atom, useAtom } from "jotai";

export const permissionsDialogAtom = atom(false);

type PermissionsConfig = Record<
  string,
  Record<keyof typeof Role_Enum, boolean>
>;

const config: PermissionsConfig = {
  "Create & Edit incognito actions": {
    Owner: true,
    Admin: true,
    Member: true,
  },
  "Delete incognito actions": {
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
  "View app metadata": {
    Owner: true,
    Admin: true,
    Member: true,
  },
  "Create & Edit app metadata": {
    Owner: true,
    Admin: true,
    Member: false,
  },
  "Delete app metadata": {
    Owner: true,
    Admin: true,
    Member: false,
  },
  "View team members & roles": {
    Owner: true,
    Admin: true,
    Member: true,
  },
  "Add & Edit team members": {
    Owner: true,
    Admin: false,
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
  "View Sign in with WorldID": {
    Owner: true,
    Admin: true,
    Member: true,
  },
  "Create & Edit Sign in with WorldID": {
    Owner: true,
    Admin: true,
    Member: false,
  },
};

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

      <DialogPanel className="w-full max-w-[1056px] grid gap-y-8">
        <header className="w-full flex justify-start">
          <Button
            type="button"
            onClick={() => setIsOpened(false)}
            className="w-8 h-8 flex justify-center items-center rounded-full bg-grey-100"
          >
            <ArrowRightIcon className="rotate-180" />
          </Button>
        </header>

        <div className="grid w-full max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-4 justify-items-center items-center mb-5">
            <Typography variant={TYPOGRAPHY.H6} className="w-full text-start">
              Permissions list
            </Typography>

            <Typography variant={TYPOGRAPHY.M4}>Owner</Typography>
            <Typography variant={TYPOGRAPHY.M4}>Admin</Typography>
            <Typography variant={TYPOGRAPHY.M4}>Member</Typography>
          </div>

          {Object.entries(config).map(([permission, roles], index) => (
            <div
              className={clsx(
                "grid grid-cols-4 justify-items-center items-center rounded-lg",
                { "bg-grey-100": index % 2 === 0 }
              )}
              key={permission}
            >
              <Typography
                variant={TYPOGRAPHY.R4}
                className="text-grey-500 text-start w-full pl-5 py-3"
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
      </DialogPanel>
    </Dialog>
  );
};
