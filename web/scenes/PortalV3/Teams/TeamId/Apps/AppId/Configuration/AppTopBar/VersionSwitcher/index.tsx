import { Dropdown } from "@/components/Dropdown";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { CheckmarkCircleIcon } from "@/components/Icons/CheckmarkCircleIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

type VersionSwitcherProps = {
  viewMode: "verified" | "unverified";
  setMode: (mode: "verified" | "unverified") => void;
  disabled?: boolean;
  verifiedAt?: string | null;
  buttonClassName?: string;
};

export const VersionSwitcher = (props: VersionSwitcherProps) => {
  const { viewMode, setMode, disabled, verifiedAt, buttonClassName } = props;

  const formattedDate = useMemo(() => {
    if (!verifiedAt) {
      return "";
    }

    const date = new Date(verifiedAt);
    const month = date.getMonth() + 1; // Months are 0-based in JavaScript
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month}.${day}.${year}`;
  }, [verifiedAt]);

  return (
    <Dropdown>
      <Dropdown.Button
        disabled={disabled}
        className={twMerge(
          "flex items-center justify-center rounded-xl border border-grey-200 bg-grey-0 px-4 py-2.5 text-grey-700 shadow-button",
          buttonClassName,
        )}
      >
        <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
          {viewMode === "verified" ? "Approved version" : "Current version"}
        </Typography>
        {!disabled && <CaretIcon className="ml-2 size-4" />}
      </Dropdown.Button>

      <Dropdown.List
        align="end"
        className="md:mt-2"
        heading="Version"
        hideBackButton
      >
        <Dropdown.ListItem className="grid-cols-1fr/auto" asChild>
          <button onClick={() => setMode("unverified")}>
            <Dropdown.ListItemText className="md:!leading-4">
              Current version
            </Dropdown.ListItemText>

            {viewMode === "unverified" && (
              <Dropdown.ListItemIcon className="size-5 text-blue-500" asChild>
                <CheckmarkCircleIcon />
              </Dropdown.ListItemIcon>
            )}
          </button>
        </Dropdown.ListItem>

        <Dropdown.ListItem className="grid-cols-1fr/auto" asChild>
          <button onClick={() => setMode("verified")}>
            <Dropdown.ListItemText className="md:!leading-4">
              Approved version
            </Dropdown.ListItemText>

            {viewMode === "verified" && (
              <Dropdown.ListItemIcon className="size-5 text-blue-500" asChild>
                <CheckmarkCircleIcon />
              </Dropdown.ListItemIcon>
            )}

            {viewMode !== "verified" && (
              <Dropdown.ListItemText className="text-grey-500 max-md:text-sm md:text-xs md:!leading-4">
                {formattedDate}
              </Dropdown.ListItemText>
            )}
          </button>
        </Dropdown.ListItem>
      </Dropdown.List>
    </Dropdown>
  );
};
