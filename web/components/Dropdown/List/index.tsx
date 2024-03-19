import { ReactNode, useContext } from "react";
import clsx from "clsx";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { dropdownContext } from "@/components/Dropdown";

type ListProps = DropdownPrimitive.DropdownMenuContentProps & {
  heading: ReactNode;
  hideBackButton?: boolean;
};

export const List = (props: ListProps) => {
  const { heading, hideBackButton, children, ...otherProps } = props;
  const { setOpen } = useContext(dropdownContext);

  return (
    <DropdownPrimitive.Portal>
      <div className="contents [&>*]:!z-[1000] max-md:[&>*]:pointer-events-none max-md:[&>*]:!inset-0 max-md:[&>*]:!transform-none">
        <DropdownPrimitive.Content forceMount asChild {...otherProps}>
          <div className="group data-[state=open]:animate-DropdownOverlayEnter max-md:!pointer-events-none max-md:fixed max-md:inset-0 max-md:flex max-md:flex-col max-md:overflow-y-auto max-md:bg-black/40 max-md:pt-5">
            <div className="pointer-events-auto grid gap-y-1 rounded-t-20 border border-grey-100 bg-grey-0 font-gta shadow-lg max-md:mt-auto max-md:px-6 max-md:pb-8 max-md:group-data-[state=open]:animate-DropdownContentEnter@device md:min-w-[12.5rem] md:max-w-[20rem] md:gap-y-0 md:rounded-12 md:py-1 md:group-data-[state=open]:animate-DropdownContentEnter@desktop">
              <div className="mb-8 pb-2.5 md:hidden">
                <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-grey-200" />

                <div className="mt-2 grid grid-cols-auto/1fr items-center pr-8">
                  <button
                    className={clsx(
                      "flex size-8 items-center justify-center rounded-full bg-grey-100",
                      {
                        invisible: hideBackButton,
                      },
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </button>

                  <div className="truncate px-4 text-center font-twk text-18 font-medium leading-6">
                    {heading}
                  </div>
                </div>
              </div>

              {children}
            </div>
          </div>
        </DropdownPrimitive.Content>
      </div>
    </DropdownPrimitive.Portal>
  );
};
