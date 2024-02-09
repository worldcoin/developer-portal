import { Button } from "@/components/Button";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";
import { CustomerSupportIcon } from "@/components/Icons/CustomerSupportIcon";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { HelpIcon } from "@/components/Icons/HelpIcon";
import { SecurityIcon } from "@/components/Icons/SecurityIcon";
import { SubtractIcon } from "@/components/Icons/SubtractIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  DISCORD_URL,
  FAQ_URL,
  GITHUB_ISSUES_URL,
  WORLDCOIN_PRIVACY_URL,
  WORLDCOIN_STATUS_URL,
} from "@/lib/constants";
import Link from "next/link";

export const HelpNav = () => {
  return (
    <Dropdown>
      <DropdownButton>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Help
        </Typography>
      </DropdownButton>

      <DropdownItems className="mt-2 py-3  text-grey-400 w-full gap-y-.5 grid min-w-[300px]">
        <Typography
          variant={TYPOGRAPHY.R4}
          className="text-grey-400 pb-2.5 px-4"
        >
          Need help with your app?
        </Typography>

        <DropdownItem className="w-full hover:bg-grey-50 px-4">
          <Button
            href={WORLDCOIN_PRIVACY_URL}
            className="grid grid-cols-auto/1fr items-center gap-x-2"
          >
            <SecurityIcon />
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
              Data Privacy & Security
            </Typography>
          </Button>
        </DropdownItem>

        <DropdownItem className="hover:bg-grey-50 px-4">
          <Button
            href={WORLDCOIN_STATUS_URL}
            className="grid grid-cols-auto/1fr items-center gap-x-2"
          >
            <SubtractIcon />
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
              Worldcoin Status
            </Typography>
          </Button>
        </DropdownItem>

        <DropdownItem className="hover:bg-grey-50 px-4">
          <Button
            href={FAQ_URL}
            className="grid grid-cols-auto/1fr items-center gap-x-2"
          >
            <HelpIcon className="w-4 h-4" />
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
              FAQ
            </Typography>
          </Button>
        </DropdownItem>
        <hr className="my-2 mb-3 w-full text-grey-200 border-1" />
        <Typography
          variant={TYPOGRAPHY.R4}
          className="text-grey-400 pb-2.5 px-4"
        >
          Community support
        </Typography>
        <DropdownItem className="hover:bg-grey-50 px-4">
          <Button
            href={DISCORD_URL}
            className="grid grid-cols-auto/1fr items-center gap-x-2"
          >
            <DiscordIcon className="w-5" />
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
              Join our Discord
            </Typography>
          </Button>
        </DropdownItem>

        <DropdownItem className="hover:bg-grey-50 px-4">
          <Button
            href={GITHUB_ISSUES_URL}
            className="grid grid-cols-auto/1fr items-center gap-x-2"
          >
            <GithubIcon className="text-grey-900 w-5" />
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
              GitHub Issues
            </Typography>
          </Button>
        </DropdownItem>
      </DropdownItems>
    </Dropdown>
  );
};
