import { Button } from "@/components/Button";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { HelpIcon } from "@/components/Icons/HelpIcon";
import { LockIcon } from "@/components/Icons/LockIcon";
import { SecurityIcon } from "@/components/Icons/SecurityIcon";
import { SubtractIcon } from "@/components/Icons/SubtractIcon";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  DISCORD_URL,
  FAQ_URL,
  GITHUB_ISSUES_URL,
  WORLDCOIN_PRIVACY_URL,
  WORLDCOIN_STATUS_URL,
} from "@/lib/constants";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { useCallback } from "react";

export const HelpNav = () => {
  const params = useParams();

  const trackHelpClick = useCallback(
    (helpLink: string) => {
      posthog.capture("clicked_help", {
        helpLink: helpLink,
        teamId: params?.teamId,
        appId: params?.appId,
        actionId: params?.actionId,
      });
    },
    [params],
  );

  return (
    <Dropdown>
      <DropdownButton>
        <div className=" flex items-center justify-center">
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Help
          </Typography>
        </div>
      </DropdownButton>

      <DropdownItems className="mt-2 grid w-full min-w-[296px] py-3 text-grey-400">
        <Typography
          variant={TYPOGRAPHY.R4}
          className="px-4 pb-2.5 text-grey-400"
        >
          Need help with your app?
        </Typography>

        <DropdownItem className="w-full px-4 hover:bg-grey-50">
          <div>
            <Button
              href={WORLDCOIN_PRIVACY_URL}
              onClick={() => trackHelpClick("worldcoin_privacy")}
              className="grid grid-cols-auto/1fr items-center gap-x-2"
            >
              <SecurityIcon />
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
                Data Privacy & Security
              </Typography>
            </Button>
          </div>
        </DropdownItem>

        <DropdownItem className="px-4 hover:bg-grey-50">
          <div>
            <Button
              href={WORLDCOIN_STATUS_URL}
              onClick={() => trackHelpClick("worldcoin_status")}
              className="grid grid-cols-auto/1fr items-center gap-x-2"
            >
              <SubtractIcon />
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
                Worldcoin Status
              </Typography>
            </Button>
          </div>
        </DropdownItem>

        <DropdownItem className="px-4 hover:bg-grey-50">
          <div>
            <Button
              href={FAQ_URL}
              onClick={() => trackHelpClick("faq")}
              className="grid grid-cols-auto/1fr items-center gap-x-2"
            >
              <HelpIcon className="size-4" />
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
                FAQ
              </Typography>
            </Button>
          </div>
        </DropdownItem>
        <hr className="my-2 mb-3 w-full text-grey-200" />
        <Typography
          variant={TYPOGRAPHY.R4}
          className="px-4 pb-2.5 text-grey-400"
        >
          Community support
        </Typography>
        <DropdownItem className="px-4 hover:bg-grey-50">
          <div>
            <Button
              href={DISCORD_URL}
              onClick={() => trackHelpClick("discord")}
              className="grid grid-cols-auto/1fr items-center gap-x-2"
            >
              <DiscordIcon className="w-5" />
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
                Join our Discord
              </Typography>
            </Button>
          </div>
        </DropdownItem>

        <DropdownItem className="px-4 hover:bg-grey-50">
          <div>
            <Button
              href={GITHUB_ISSUES_URL}
              onClick={() => trackHelpClick("github_issues")}
              className="grid grid-cols-auto/1fr items-center gap-x-2"
            >
              <GithubIcon className="w-5 text-grey-900" />
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
                GitHub Issues
              </Typography>
            </Button>
          </div>
        </DropdownItem>
        <hr className="my-2 mb-3 w-full text-grey-200" />
        <Typography
          variant={TYPOGRAPHY.R4}
          className="px-4 pb-2.5 text-grey-400"
        >
          References
        </Typography>
        <DropdownItem className="px-4 hover:bg-grey-50">
          <div>
            <Button
              href={"/privacy-statement"}
              className="grid grid-cols-auto/1fr items-center gap-x-2"
            >
              <LockIcon className="size-4" />
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
                Privacy Policy
              </Typography>
            </Button>
          </div>
        </DropdownItem>
        <DropdownItem className="px-4 hover:bg-grey-50">
          <div>
            <Button
              href={"/tos"}
              className="grid grid-cols-auto/1fr items-center gap-x-2"
            >
              <WorldcoinIcon className="size-4" />
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
                Terms of service
              </Typography>
            </Button>
          </div>
        </DropdownItem>
      </DropdownItems>
    </Dropdown>
  );
};
