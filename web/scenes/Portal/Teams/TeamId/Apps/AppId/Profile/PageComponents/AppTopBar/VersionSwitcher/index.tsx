import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { FetchAppMetadataQuery } from "../../../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../../../layout/ImagesProvider";

type VersionSwitcherProps = {
  app: FetchAppMetadataQuery["app"][0];
};
export const VersionSwitcher = (props: VersionSwitcherProps) => {
  const { app } = props;
  const [viewMode, setMode] = useAtom(viewModeAtom);

  const formattedDate = useMemo(() => {
    const date = new Date(app?.verified_app_metadata[0]?.verified_at);
    const month = date.getMonth() + 1; // Months are 0-based in JavaScript
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month}.${day}.${year}`;
  }, [app?.verified_app_metadata]);

  return (
    <Dropdown>
      <DropdownButton
        disabled={app?.app_metadata.length === 0}
        className="flex items-center justify-center rounded-xl border border-grey-200 bg-grey-0 px-4  py-2.5 text-grey-700 shadow-button"
      >
        <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
          {viewMode === "verified" ? "Approved version" : "Current version"}
        </Typography>
        {app?.app_metadata.length > 0 && <CaretIcon className="ml-2 size-4" />}
      </DropdownButton>
      <DropdownItems className="mt-2">
        <DropdownItem
          onClick={() => setMode("unverified")}
          className="py-1 pl-1 hover:bg-grey-50"
        >
          <div className="grid w-full grid-cols-1fr/auto items-center">
            <Typography
              variant={TYPOGRAPHY.R3}
              className="max-w-full px-4 py-2.5 text-grey-900"
            >
              Current version
            </Typography>
            {viewMode === "unverified" && (
              <CheckIcon size="16" className="ml-2 size-3" />
            )}
          </div>
        </DropdownItem>
        <DropdownItem
          onClick={() => setMode("verified")}
          className="py-1 pl-1 hover:bg-grey-50"
        >
          <div className="grid w-full grid-cols-1fr/auto items-center justify-start">
            <Typography
              as="div"
              variant={TYPOGRAPHY.R3}
              className=" max-w-full px-4 py-2.5 text-grey-900"
            >
              Approved version
            </Typography>
            {viewMode === "verified" && (
              <CheckIcon size="16" className="ml-2 size-3" />
            )}
            <Typography className="text-grey-500" variant={TYPOGRAPHY.R5}>
              {viewMode !== "verified" && formattedDate}
            </Typography>
          </div>
        </DropdownItem>
      </DropdownItems>
    </Dropdown>
  );
};
