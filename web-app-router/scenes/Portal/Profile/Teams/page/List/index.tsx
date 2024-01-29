"use client";
import Image from "next/image";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import {
  Dropdown,
  DropdownButton,
  DropdownItems,
  DropdownItem,
} from "@/components/Dropdown";
import { LoginSquareIcon } from "@/components/Icons/LoginSquareIcon";
import { LogoutIcon } from "@/components/Icons/LogoutIcon";
import { DeleteTeamDialog } from "@/scenes/Portal/Profile/Teams/page/DeleteTeamDialog";
import { useState } from "react";
import { LeaveTeamDialog } from "@/scenes/Portal/Profile/Teams/page/LeaveTeamDialog";
import { ExchangeIcon } from "@/components/Icons/ExchangeIcon";
import { EditIcon } from "@/components/Icons/EditIcon";
import { TransferTeamDialog } from "@/scenes/Portal/Profile/Teams/page/TransferTeamDialog";
import { EditTeamDialog } from "@/scenes/Portal/Profile/Teams/page/EditTeamDialog";

export const List = () => {
  const [teamForEdit, setTeamForEdit] = useState<any>(null);
  const [teamForTransfer, setTeamForTransfer] = useState<any>(null);
  const [teamForDelete, setTeamForDelete] = useState<any>(null);
  const [teamForLeave, setTeamForLeave] = useState<any>(null);
  return (
    <>
      <div className="grid grid-cols-[1fr_1fr_auto]">
        <div className="contents leading-4 text-12 text-grey-400">
          <div className="py-3 border-b border-grey-100">Member</div>

          <div className="py-3 border-b border-grey-100">Role</div>
          <div className="py-3 border-b border-grey-100" />
        </div>

        <div className="contents">
          <div className="flex items-center gap-x-4 px-2 py-4 leading-6 text-16 border-b border-grey-100">
            <Image className="w-12 h-12" alt="" src="" />
            A11 Team
          </div>

          <div className="flex items-center px-2 py-4 leading-5 text-14 text-grey-500 border-b border-grey-100">
            Owner
          </div>

          <div className="flex items-center px-2 py-4 border-b border-grey-100">
            <Dropdown>
              <DropdownButton>
                <MoreVerticalIcon />
              </DropdownButton>

              <DropdownItems>
                <DropdownItem onClick={() => setTeamForEdit({})}>
                  <div className="flex items-center gap-x-2">
                    <EditIcon className="w-4 h-4 text-grey-400" />
                    Edit team
                  </div>
                </DropdownItem>

                <DropdownItem onClick={() => setTeamForTransfer({})}>
                  <div className="flex items-center gap-x-2">
                    <ExchangeIcon className="w-4 h-4 text-grey-400" />
                    Transfer ownership
                  </div>
                </DropdownItem>

                <DropdownItem onClick={() => setTeamForDelete({})}>
                  <div className="flex items-center gap-x-2 text-system-error-600">
                    <LogoutIcon className="w-4 h-4" />
                    Delete team
                  </div>
                </DropdownItem>
              </DropdownItems>
            </Dropdown>
          </div>
        </div>

        <div className="contents">
          <div className="flex items-center gap-x-4 px-2 py-4 leading-6 text-16 border-b border-grey-100">
            <Image className="w-12 h-12" alt="" src="" />
            A11 Team
          </div>

          <div className="flex items-center px-2 py-4 leading-5 text-14 text-grey-500 border-b border-grey-100">
            Owner
          </div>

          <div className="flex items-center px-2 py-4 border-b border-grey-100">
            <Dropdown>
              <DropdownButton>
                <MoreVerticalIcon />
              </DropdownButton>

              <DropdownItems>
                <DropdownItem>
                  <div className="flex items-center gap-x-2">
                    <LoginSquareIcon className="w-4 h-4 text-grey-400" />
                    Switch to team
                  </div>
                </DropdownItem>

                <DropdownItem onClick={() => setTeamForLeave({})}>
                  <div className="flex items-center gap-x-2 text-system-error-600">
                    <LogoutIcon className="w-4 h-4" />
                    Leave team
                  </div>
                </DropdownItem>
              </DropdownItems>
            </Dropdown>
          </div>
        </div>
      </div>

      <DeleteTeamDialog
        open={!!teamForDelete}
        onClose={() => setTeamForDelete(null)}
      />

      <EditTeamDialog
        open={!!teamForEdit}
        onClose={() => setTeamForEdit(null)}
      />

      <LeaveTeamDialog
        open={!!teamForLeave}
        onClose={() => setTeamForLeave(null)}
      />

      <TransferTeamDialog
        open={!!teamForTransfer}
        onClose={() => setTeamForTransfer(null)}
      />
    </>
  );
};
