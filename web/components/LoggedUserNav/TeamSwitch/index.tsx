import {
  autoUpdate,
  FloatingPortal,
  size,
  useFloating,
} from "@floating-ui/react";
import { Menu, MenuProps, Transition } from "@headlessui/react";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";
import { Fragment } from "react";
import { useFetchTeamsQuery } from "@/components/LoggedUserNav/TeamSwitch/graphql/client/fetch-teams.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { LoginSquareIcon } from "@/components/Icons/LoginSquareIcon";
import { TeamLogo } from "./TeamLogo";
import { AddCircleIcon } from "@/components/Icons/AddCircleIcon";
import Link from "next/link";
import { CheckmarkCircleIcon } from "@/components/Icons/CheckmarkCircleIcon";

export const TeamSwitch = (props: { selectedTeamId?: string }) => {
  const { user } = useUser() as Auth0SessionUser;

  const teamsQueryRes = useFetchTeamsQuery({
    context: { headers: { team_id: "_" } },
    skip: !user?.hasura,
  });

  return (
    <div className="-mx-4 -my-2.5">
      <Dropdown placement="left-start">
        <DropdownButton>
          <div className="grid grid-cols-auto/1fr items-center gap-x-2 px-4 py-2.5">
            <LoginSquareIcon className="h-4 w-4 text-grey-400" /> Switch team
          </div>
        </DropdownButton>

        <DropdownItems className="relative -left-1 -top-1">
          <div className="px-4 py-2.5 text-14 leading-5 text-grey-400">
            Teams
          </div>

          {teamsQueryRes.data?.teams.map((team) => (
            <DropdownItem key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="grid grid-cols-auto/1fr/auto items-center gap-x-2"
              >
                <TeamLogo
                  src={""}
                  name={
                    team.name ?? "" /*FIXME: team.name must be non nullable*/
                  }
                />

                {team.name}

                {team.id === props.selectedTeamId && (
                  <CheckmarkCircleIcon className="text-blue-500" />
                )}
              </Link>
            </DropdownItem>
          ))}

          <DropdownItem>
            <div className="grid grid-cols-auto/1fr items-center gap-x-2">
              <AddCircleIcon className="h-4 w-4 text-grey-400" /> Create new
              team
            </div>
          </DropdownItem>
        </DropdownItems>
      </Dropdown>
    </div>
  );
  // const { refs, floatingStyles } = useFloating({
  //   placement: "left-start",
  //   strategy: "fixed",
  //   whileElementsMounted: autoUpdate,
  //   middleware: [
  //     size({
  //       apply({ availableWidth, availableHeight, elements, rects }) {
  //         Object.assign(elements.floating.style, {
  //           minWidth: `${rects.reference.width}px`,
  //           maxWidth: `${availableWidth}px`,
  //           maxHeight: `${availableHeight}px`,
  //         });
  //       },
  //     }),
  //   ],
  // });
  //
  // return (
  //   <div className="-mx-4 -my-2.5">
  //     <Menu>
  //       <Menu.Button
  //         ref={refs.setReference}
  //       >
  //         <div>
  //           switch team
  //         </div>
  //       </Menu.Button>
  //       <FloatingPortal>
  //         <div
  //           ref={refs.setFloating}
  //           style={floatingStyles}
  //           className="z-[1] flex flex-col"
  //         >
  //           <Transition
  //             enter="transition duration-300 ease-out"
  //             enterFrom="transform opacity-0"
  //             enterTo="transform opacity-100"
  //             leave="transition duration-150 ease-out"
  //             leaveFrom="transform opacity-100"
  //             leaveTo="transform opacity-0"
  //             as={Fragment}
  //           >
  //             <Menu.Items
  //               className="min-h-0 overflow-y-auto rounded-12 border border-grey-100 bg-grey-0 py-1 shadow-lg"
  //             >
  //               <Menu.Item
  //
  //               >
  //                 <div
  //                   className="cursor-pointer px-4 py-2.5 text-14 leading-5"
  //                 >
  //                   item
  //                 </div>
  //               </Menu.Item>
  //             </Menu.Items>
  //           </Transition>
  //         </div>
  //       </FloatingPortal>
  //     </Menu>
  //   </div>
  // )
};
