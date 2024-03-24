import clsx from "clsx";
import { GetActionsQuery } from "../../graphql/client/actions.generated";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { CopyButton } from "@/components/CopyButton";
import { Dropdown } from "@/components/Dropdown";
import { ElementsIcon } from "@/components/Icons/ElementsIcon";
import { EditIcon } from "@/components/Icons/EditIcon";
import Skeleton from "react-loading-skeleton";

type ItemProps = {
  item?: GetActionsQuery["actions"][0];
  onClickView?: () => void;
};
export const Item = (props: ItemProps) => {
  const { item, onClickView } = props;

  return (
    <div
      className={clsx(
        "group max-md:grid max-md:grid-cols-1fr/auto max-md:rounded-2xl max-md:border max-md:px-2 max-md:hover:bg-grey-25 md:contents [&>*]:border-gray-100 [&>*]:px-2 md:[&>*]:border-b",
        {
          "cursor-pointer": !!item,
        },
      )}
    >
      <div className="grid grid-cols-auto/1fr items-center gap-x-4 py-4 md:group-hover:bg-grey-25">
        {item ? (
          <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 uppercase text-blue-500">
            <Typography variant={TYPOGRAPHY.M3}>{item.name[0]}</Typography>
          </div>
        ) : (
          <Skeleton className="size-12 leading-normal" circle inline />
        )}

        <div className="grid gap-y-0.5">
          <Typography variant={TYPOGRAPHY.R3} className="truncate">
            {item ? item.name : <Skeleton width={200} />}
          </Typography>

          <div className="flex items-center gap-x-1">
            <Typography
              variant={TYPOGRAPHY.R4}
              className="truncate text-grey-500"
            >
              {item ? item.action : <Skeleton width={150} />}
            </Typography>

            {!!item && (
              <CopyButton
                fieldValue={item.action}
                fieldName="Action identifier"
                className="cursor-pointer opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid items-center md:group-hover:bg-grey-25">
        <Typography variant={TYPOGRAPHY.R4} className="truncate text-grey-500">
          {item ? (
            item.nullifiers.aggregate?.sum?.uses ?? 0
          ) : (
            <Skeleton width={20} />
          )}
        </Typography>
      </div>

      <div
        className="grid items-center max-md:hidden md:group-hover:bg-grey-25"
        onClick={(e) => e.stopPropagation()}
      >
        {!item ? (
          <div className="flex size-8 items-center justify-center">
            <ElementsIcon className="text-grey-400" />
          </div>
        ) : (
          <Dropdown>
            <Dropdown.Button className="flex size-8 items-center justify-center rounded-lg hover:bg-grey-100">
              <ElementsIcon />
            </Dropdown.Button>

            <Dropdown.List align="end" heading={item.name} hideBackButton>
              <Dropdown.ListItem asChild>
                <button onClick={onClickView}>
                  <Dropdown.ListItemIcon asChild>
                    <EditIcon />
                  </Dropdown.ListItemIcon>

                  <Dropdown.ListItemText>View details</Dropdown.ListItemText>
                </button>
              </Dropdown.ListItem>
            </Dropdown.List>
          </Dropdown>
        )}
      </div>
    </div>
  );
};
