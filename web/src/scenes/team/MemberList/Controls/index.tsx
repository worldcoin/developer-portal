import { Button } from "@/components/Button";
import { FieldInput } from "@/components/FieldInput";
import { Icon } from "@/components/Icon";
import { memo } from "react";

export const Controls = memo(function Controls(props: {
  onInviteClick: () => void;
  onFilterClick: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-y-8">
      <h3 className="text-14 font-medium">Team members</h3>

      <div className="flex gap-16">
        <div className="flex-1 relative">
          <FieldInput
            className="w-full pl-12"
            placeholder="Search for a team member..."
            value={props.searchValue}
            onChange={(e) => props.onSearchChange(e.target.value)}
          />

          <Icon
            name="search"
            className="w-6 h-6 absolute top-1/2 -translate-y-1/2 left-4"
          />
        </div>

        <div className="flex gap-4">
          <Button
            className="py-3 px-8 uppercase flex gap-2.5"
            disabled={props.searchValue.length <= 0}
            onClick={props.onFilterClick}
          >
            <Icon name="filter" className="w-6 h-6 bg-191c20" />
            Filter
          </Button>

          {/* <Button
            className="py-3.5 px-8 uppercase"
            onClick={props.onInviteClick}
          >
            Invite new members
          </Button> */}
        </div>
      </div>
    </div>
  );
});
