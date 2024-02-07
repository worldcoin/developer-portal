import { useAtom } from "jotai";
import { viewModeAtom } from "../../../layout";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { FetchAppMetadataQuery } from "../../../graphql/client/fetch-app-metadata.generated";
import { useMemo } from "react";

type VersionSwitcherProps = {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
};
export const VersionSwitcher = (props: VersionSwitcherProps) => {
  const { appId, teamId, app } = props;
  const [viewMode, setMode] = useAtom(viewModeAtom);

  const formattedDate = useMemo(() => {
    const date = new Date(app?.verified_app_metadata[0].verified_at);
    const month = date.getMonth() + 1; // Months are 0-based in JavaScript
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month}.${day}.${year}`;
  }, [app?.verified_app_metadata]);

  return (
    <Dropdown>
      <DropdownButton className="bg-grey-0 text-grey-700 border-grey-200 shadow-button px-4 py-2.5 rounded-xl border  flex items-center justify-center">
        <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
          {viewMode === "verified" ? "Approved version" : "Current version"}
        </Typography>
        <CaretIcon className="w-4 h-4 ml-2" />
      </DropdownButton>
      <DropdownItems className="mt-2">
        <DropdownItem
          onClick={() => setMode("unverified")}
          className="hover:bg-grey-50 pl-1 py-1"
        >
          <div className="grid grid-cols-1fr/auto items-center w-full">
            <Typography
              variant={TYPOGRAPHY.R3}
              className="max-w-full px-4 py-2.5 text-grey-900"
            >
              Current version
            </Typography>
            {viewMode === "unverified" && (
              <CheckIcon className="w-3 h-3 ml-2" />
            )}
          </div>
        </DropdownItem>
        <DropdownItem
          onClick={() => setMode("verified")}
          className="hover:bg-grey-50 pl-1 py-1"
        >
          <div className="grid grid-cols-1fr/auto items-center w-full justify-start">
            <Typography
              as="div"
              variant={TYPOGRAPHY.R3}
              className=" max-w-full px-4 py-2.5 text-grey-900"
            >
              Approved version
            </Typography>
            {viewMode === "verified" && <CheckIcon className="w-3 h-3 ml-2" />}
            <Typography className="text-grey-500" variant={TYPOGRAPHY.R5}>
              {viewMode !== "verified" && formattedDate}
            </Typography>
          </div>
        </DropdownItem>
      </DropdownItems>
    </Dropdown>
  );
};
