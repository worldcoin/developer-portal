import { User } from "lucide-react";
import { UIModule } from "./UIModule";

export const ProfileBadge = () => {
  return (
    <UIModule className="grid size-10 place-items-center p-0">
      <User className="size-5" />
    </UIModule>
  );
};
