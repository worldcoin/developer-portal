import { Illustration } from "@/components/Auth/Illustration";
import { memo } from "react";

export const Header = memo(function Header() {
  return (
    <div className="flex items-center gap-6">
      <Illustration icon="team" />

      <div className="space-y-1">
        <h1 className="text-20 font-sora font-semibold">My Team</h1>

        <span className="text-neutral-secondary text-14">
          Update your team settings and invite others to collaborate.
        </span>
      </div>
    </div>
  );
});
