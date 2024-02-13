import { EditIcon } from "@/components/Icons/EditIcon";
import { ElementsIcon } from "@/components/Icons/ElementsIcon";
import { Link } from "@/components/Link";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Menu } from "@headlessui/react";

export const DetailsMenu = (props: { path: string }) => {
  const { path } = props;
  return (
    <Menu as="div" className="relative z-10 inline-block">
      <Menu.Button
        className="flex size-8 items-center justify-center rounded-lg p-2 hover:bg-grey-100"
        onClick={(event) => event.stopPropagation()}
      >
        <ElementsIcon />
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-1 origin-top-right rounded-lg border border-grey-100 bg-white py-2 pl-2  pr-10 shadow-button ring-0  hover:bg-grey-50 focus:outline-none">
        <Menu.Item>
          {({ active }) => (
            <div className="flex size-full cursor-pointer flex-row items-center gap-2">
              <button>
                <EditIcon className="text-grey-400" />
              </button>
              <Link className="text-grey-900" href={path}>
                <Typography variant={TYPOGRAPHY.R4}>View Details</Typography>
              </Link>
            </div>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
};
