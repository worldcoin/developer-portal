import { User } from "lucide-react";
import { UIModule } from "./UIModule";

export const ProfileBadge = () => {
  return (
    <UIModule className="grid place-items-center p-2">
      <User className="size-6" />
    </UIModule>
  );
};
