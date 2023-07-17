import { memo } from "react";
import { Illustration } from "src/components/Auth/Illustration";
import { Icon } from "src/components/Icon";

export const Header = memo(function Header() {
  return (
    <div className="flex items-center gap-6">
      <Illustration icon="team" className="w-16 h-16" />

      <div className="space-y-1">
        <h1 className="text-20 font-sora font-semibold">My Team</h1>

        <span className="text-neutral-secondary text-14">
          Update your team settings and invite others to collaborate.
        </span>
      </div>
    </div>
  );
});
