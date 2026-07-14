import { ReactNode, useContext } from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { subContext } from "@/components/Dropdown/Sub";

type SubListProps = DropdownPrimitive.DropdownMenuSubContentProps & {
  heading: ReactNode;
};

export const SubList = (props: SubListProps) => {
  const { heading, children, ...otherProps } = props;
  const { setOpen } = useContext(subContext);

  return (
    <DropdownPrimitive.Portal>
      <div className="contents *:z-1000! max-md:*:pointer-events-none max-md:*:inset-0! max-md:*:transform-none!">
        <DropdownPrimitive.SubContent asChild {...otherProps}>
          <div
            className="group data-[state=open]:animate-dropdown-overlay-enter max-md:fixed max-md:inset-0 max-md:flex max-md:flex-col max-md:overflow-y-auto max-md:bg-black/40 max-md:pt-5"
            onClick={() => setOpen(false)}
          >
            <div className="pointer-events-auto grid gap-y-1 rounded-t-20 border border-grey-100 bg-grey-0 font-gta shadow-lg max-md:mt-auto max-md:px-6 max-md:pb-8 max-md:group-data-[state=open]:animate-dropdown-content-enter-device md:mx-1 md:max-w-[20rem] md:min-w-50 md:gap-y-0 md:rounded-12 md:py-1 md:group-data-[state=open]:animate-dropdown-content-enter-desktop">
              <div className="mb-8 md:hidden">
                <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-grey-200" />

                <div className="flex items-center pt-2 pr-8 pb-2.5">
                  <button
                    className="flex size-8 items-center justify-center rounded-full bg-grey-100"
                    onClick={() => setOpen(false)}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </button>

                  <div className="grow text-center font-twk text-18 leading-6 font-medium">
                    {heading}
                  </div>
                </div>
              </div>

              {children}
            </div>
          </div>
        </DropdownPrimitive.SubContent>
      </div>
    </DropdownPrimitive.Portal>
  );
};
