import { CopyButton } from "@/components/CopyButton";
import { Dropdown } from "@/components/Dropdown";
import { EditIcon } from "@/components/Icons/EditIcon";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { TrashIcon } from "@/components/Icons/TrashIcon";

type DomainRowProps = {
  domain: string;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export const DomainRow = (props: DomainRowProps) => {
  const { domain, canEdit, onEdit, onDelete } = props;

  return (
    <div className="flex h-[52px] items-center gap-x-3 rounded-xl border border-grey-100 pl-4 pr-2">
      <span
        className="min-w-0 flex-1 truncate font-world text-[15px] text-grey-900"
        title={domain}
      >
        {domain}
      </span>

      <CopyButton
        fieldName="Domain"
        fieldValue={domain}
        className="rounded-lg p-2 !pr-2 hover:bg-grey-100"
        iconClassName="size-4 text-grey-500"
      />

      {canEdit && (
        <Dropdown>
          <Dropdown.Button
            type="button"
            className="rounded-lg p-2 hover:bg-grey-100"
            aria-label={`Options for ${domain}`}
          >
            <MoreVerticalIcon className="size-4 text-grey-500" />
          </Dropdown.Button>

          <Dropdown.List align="end" heading={domain} hideBackButton>
            <Dropdown.ListItem asChild>
              <button type="button" onClick={onEdit}>
                <Dropdown.ListItemIcon asChild>
                  <EditIcon />
                </Dropdown.ListItemIcon>

                <Dropdown.ListItemText>Edit</Dropdown.ListItemText>
              </button>
            </Dropdown.ListItem>

            <Dropdown.ListItem asChild>
              <button type="button" onClick={onDelete}>
                <Dropdown.ListItemIcon
                  className="text-system-error-600"
                  asChild
                >
                  <TrashIcon />
                </Dropdown.ListItemIcon>

                <Dropdown.ListItemText className="text-system-error-600">
                  Delete
                </Dropdown.ListItemText>
              </button>
            </Dropdown.ListItem>
          </Dropdown.List>
        </Dropdown>
      )}
    </div>
  );
};
