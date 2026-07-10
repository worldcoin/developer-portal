import { ChevronLeft } from "lucide-react";
import { UIModule } from "./UIModule";

export const BackButton = () => {
  return (
    <UIModule className="size-10 p-0 lg:hidden">
      <button className="grid size-full place-items-center rounded-16 outline-none hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-blue-500">
        <ChevronLeft className="size-5" />
      </button>
    </UIModule>
  );
};
