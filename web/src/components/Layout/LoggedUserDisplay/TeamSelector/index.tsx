import { Fragment, memo, useCallback, useMemo } from "react";
import { FetchUserQuery } from "../graphql/fetch-user.generated";
import { Menu } from "@headlessui/react";
import AnimateHeight from "react-animate-height";
import Link from "next/link";
import { useRouter } from "next/router";
import { Icon } from "@/components/Icon";
import cn from "classnames";
import { urls } from "@/lib/urls";

export const TeamSelector = memo(function TeamSelector(props: {
  memberships: FetchUserQuery["user"][number]["memberships"];
}) {
  const router = useRouter();
  const team_id = router.query.team_id as string;

  const currentTeam = useMemo(() => {
    return props.memberships.find((m) => m.team.id === team_id)?.team;
  }, [props.memberships, team_id]);

  const membershipList = useMemo(() => {
    return props.memberships.filter((m) => m.team.id !== team_id);
  }, [props.memberships, team_id]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {(props.memberships?.length ?? 0) > 0 && (
        <Menu
          as="div"
          onClick={(e) => e.stopPropagation()}
          className="relative h-[28px] peer"
        >
          {({ open }) => (
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 min-h-[28px] bg-fbfbfc border border-ebecef rounded-lg z-10 transition-shadow duration-300",
                {
                  "shadow-input": open,
                }
              )}
            >
              <AnimateHeight
                id="example-panel"
                duration={300}
                height={open ? "auto" : 0}
                dir={"top"}
              >
                <Menu.Items className="relative grid gap-y-1 my-1 px-2" static>
                  {membershipList.map((membership) => (
                    <Menu.Item
                      key={membership.id}
                      as={Link}
                      href={urls.app({ team_id: membership.team.id })}
                      className={cn({
                        "text-gray-900": membership.team.id === team_id,
                        "text-gray-500 hover:text-gray-900":
                          membership.team.id !== team_id,
                      })}
                    >
                      <span className={cn("text-[13px]")}>
                        {membership.team.name}
                      </span>
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </AnimateHeight>

              <Menu.Button className="flex items-center text-[13px] justify-between w-full h-[28px] px-2 outline-none">
                {currentTeam && <span>{currentTeam.name}</span>}

                {!currentTeam && (
                  <span className="text-gray-900 font-sora">Select team</span>
                )}

                <Icon
                  name="angle-down"
                  className={cn("w-4 h-4 transition-transform", {
                    "rotate-180": open,
                  })}
                />
              </Menu.Button>
            </div>
          )}
        </Menu>
      )}
    </div>
  );
});
