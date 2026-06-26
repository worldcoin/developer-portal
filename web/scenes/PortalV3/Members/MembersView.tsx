import { Placeholder } from "@/components/PlaceholderImage";

export type Member = {
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
};

/**
 * Team members page (presentational), Vercel-style: a header with an Invite CTA
 * (World blue — the accent lives on actions) and a card list of members with
 * role badges. Data + the invite/role/remove actions wire in via a container.
 */
export const MembersView = (props: { members: Member[] }) => {
  return (
    <div className="mx-auto max-w-[960px] px-6 py-7">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-twk text-24 font-medium">Members</h1>
        <button
          type="button"
          className="rounded-8 bg-accent px-3 py-1.5 font-gta text-14 font-medium text-accent-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Invite
        </button>
      </div>

      <div className="mt-5 divide-y divide-border overflow-hidden rounded-12 border border-border bg-card">
        {props.members.map((member) => (
          <div key={member.email} className="flex items-center gap-3 px-4 py-3">
            <Placeholder
              name={member.name}
              seed={member.email}
              className="size-8 shrink-0 text-xs"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-gta text-14 font-medium">
                {member.name}
              </div>
              <div className="truncate text-13 text-muted-foreground">
                {member.email}
              </div>
            </div>
            <span className="shrink-0 rounded-8 bg-muted px-2 py-0.5 text-12 font-medium text-muted-foreground">
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
