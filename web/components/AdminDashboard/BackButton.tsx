import { ChevronLeft } from "lucide-react";
import { UIModule } from "./UIModule";

export const BackButton = () => {
  return (
    <UIModule className="block p-0 lg:hidden">
      <button className="grid place-items-center rounded-16 p-2 outline-none hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-blue-500">
        <ChevronLeft className="size-6" />
      </button>
    </UIModule>
  );
};
