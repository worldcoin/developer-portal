import { FieldInput } from "@/components/FieldInput";
import { Icon } from "@/components/Icon";
import { memo } from "react";

export const Controls = memo(function Controls(props: {
  onInviteClick: () => void;
  keyword: string;
  onKeywordChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-y-8">
      <h3 className="text-14 font-medium">Team members</h3>

      <div className="flex gap-16">
        <div className="flex-1 relative">
          <FieldInput
            className="w-full pl-12"
            placeholder="Search for a team member..."
            defaultValue={props.keyword}
            onChange={(e) => props.onKeywordChange(e.target.value)}
          />

          <Icon
            name="search"
            className="w-6 h-6 absolute top-1/2 -translate-y-1/2 left-4"
          />
        </div>

        {/* <Button className="py-3.5 px-8 uppercase" onClick={props.onInviteClick}>
          Invite new members
        </Button> */}
      </div>
    </div>
  );
});
