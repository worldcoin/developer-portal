import { EditIcon } from "@/components/Icons/EditIcon";
import { ElementsIcon } from "@/components/Icons/ElementsIcon";
import { Link } from "@/components/Link";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Menu } from "@headlessui/react";

export const DetailsMenu = (props: { path: string }) => {
  const { path } = props;
  return (
    <Menu as="div" className="relative inline-block z-10">
      <Menu.Button
        className="w-8 h-8 flex justify-center items-center p-2 hover:bg-grey-100 rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <ElementsIcon />
      </Menu.Button>
      <Menu.Items className="transform absolute right-0 shadow-button mt-1 py-2 pr-10 pl-2 origin-top-right bg-white hover:bg-grey-50  border-grey-100 border rounded-lg  ring-0 focus:outline-none">
        <Menu.Item>
          {({ active }) => (
            <div className="cursor-pointer gap-2 flex flex-row items-center w-full h-full">
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
