import { Fragment, memo } from "react";
import { Item } from "./Item";
import { FieldInput } from "src/components/LegacyFieldInput";
import { FieldInputAddon } from "src/components/LegacyFieldInputAddon";
import { FieldInputAddonAction } from "src/components/FieldInputAddonAction";
import { Icon } from "src/components/Icon";
import { useActions, useValues } from "kea";
import { teamLogic } from "src/logics/teamLogic";
import { Preloader } from "src/components/Preloader";
import { teamMembersLogic } from "src/logics/teamMembersLogic";
import useAuth from "src/hooks/useAuth";

export const Members = memo(function Members() {
  const { members, teamLoading } = useValues(teamLogic);
  const { deleteTeamMember } = useActions(teamMembersLogic);
  const { user } = useAuth();

  return (
    <Fragment>
      {teamLoading && <Preloader className="w-20 h-20" />}
      {!teamLoading && members && (
        <Fragment>
          <div className="grid mb-8 grid-cols-1fr/auto">
            <FieldInput
              className="pl-12"
              type="text"
              name="keyword"
              placeholder="Search for a team member..."
              defaultValue={""}
              onChange={(e) => {}}
              addon={
                <FieldInputAddon position="start">
                  <FieldInputAddonAction>
                    <Icon name="search" className="w-6 h-6 text-d1d3d4" />
                  </FieldInputAddonAction>
                </FieldInputAddon>
              }
            />
            {/* @FIXME add filter button here */}
            {/*<Button*/}{" "}
            {/* @FIXME uncomment after invitation mechanism appears */}
            {/*  variant="contained"*/}
            {/*  color="primary"*/}
            {/*  type="button"*/}
            {/*>*/}
            {/*  Invite new member*/}
            {/*</Button>*/}
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full overflow-x-auto border border-separate border-neutral-muted rounded-xl">
              <thead>
                <tr>
                  <th className="p-5 font-medium text-left text-14 text-neutral">
                    Name
                  </th>
                  <th className="p-5 font-medium text-left text-14 text-neutral">
                    Email
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {members?.length ? (
                  members.map((item, i) => (
                    <Item
                      key={i}
                      item={item}
                      onRemove={deleteTeamMember}
                      //isCurrentUser={item.id === user?.id}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-5 py-12 text-center border-t text-14 text-neutral border-neutral-muted"
                      colSpan={3}
                    >
                      <span>
                        You don’t have any team members yet.{" "}
                        <button className="text-primary">
                          Invite team member
                        </button>
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
});
