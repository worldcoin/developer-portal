import { Button } from "@/components/Button";
import { Dropdown } from "components/Dropdown";
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
import { urls } from "@/lib/urls";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { useCallback } from "react";
import { HelpSquareIcon } from "@/components/Icons/HelpSquareIcon";

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
    <Dropdown
      placement="bottom-end"
      //zIndex={60}
    >
      <Dropdown.Button className="grid w-full grid-cols-auto/1fr items-center justify-items-start gap-x-4 px-2 py-2.5 md:grid-cols-1 md:p-0 md:font-gta md:text-sm md:leading-none md:text-grey-500">
        <HelpSquareIcon className="text-grey-400 md:hidden" />
        Help
      </Dropdown.Button>

      <Dropdown.Items className="md:mt-2 md:grid md:w-full md:min-w-[296px]">
        <div className="px-2 py-2.5 text-14 leading-5 text-grey-400 md:px-4">
          Need help with your app?
        </div>

        <Dropdown.Item className="w-full p-0">
          <div>
            <Button
              href={WORLDCOIN_PRIVACY_URL}
              onClick={() => trackHelpClick("worldcoin_privacy")}
              className="grid grid-cols-auto/1fr items-center gap-x-4 px-2 py-2.5 md:gap-x-2 md:px-4"
            >
              <SecurityIcon className="size-6 text-grey-400 md:size-4" />
              Data Privacy & Security
            </Button>
          </div>
        </Dropdown.Item>

        <Dropdown.Item className="p-0">
          <div>
            <Button
              href={WORLDCOIN_STATUS_URL}
              onClick={() => trackHelpClick("worldcoin_status")}
              className="grid grid-cols-auto/1fr items-center gap-x-4 px-2 py-2.5 md:gap-x-2 md:px-4"
            >
              <SubtractIcon className="size-6 text-grey-400 md:size-4" />
              Worldcoin Status
            </Button>
          </div>
        </Dropdown.Item>

        <Dropdown.Item className="p-0">
          <div>
            <Button
              href={FAQ_URL}
              onClick={() => trackHelpClick("faq")}
              className="grid grid-cols-auto/1fr items-center gap-x-4 px-2 py-2.5 md:gap-x-2 md:px-4"
            >
              <HelpIcon className="size-6 text-grey-400 md:size-4" />
              FAQ
            </Button>
          </div>
        </Dropdown.Item>

        <hr className="my-2 mb-3 w-full text-grey-200" />

        <div className="px-2 py-2.5 text-14 leading-5 text-grey-400 md:px-4">
          Community support
        </div>

        <Dropdown.Item className="p-0">
          <div>
            <Button
              href={DISCORD_URL}
              onClick={() => trackHelpClick("discord")}
              className="grid grid-cols-auto/1fr items-center gap-x-4 px-2 py-2.5 md:gap-x-2 md:px-4"
            >
              <DiscordIcon className="size-6 md:size-4" />
              Join our Discord
            </Button>
          </div>
        </Dropdown.Item>

        <Dropdown.Item className="p-0">
          <div>
            <Button
              href={GITHUB_ISSUES_URL}
              onClick={() => trackHelpClick("github_issues")}
              className="grid grid-cols-auto/1fr items-center gap-x-4 px-2 py-2.5 md:gap-x-2 md:px-4"
            >
              <GithubIcon className="size-6 md:size-4" />
              GitHub Issues
            </Button>
          </div>
        </Dropdown.Item>

        <hr className="my-2 mb-3 w-full text-grey-200" />

        <div className="px-2 py-2.5 text-14 leading-5 text-grey-400 md:px-4">
          References
        </div>

        <Dropdown.Item className="p-0">
          <div>
            <Button
              href={urls.privacyStatement()}
              target="_blank"
              className="grid grid-cols-auto/1fr items-center gap-x-4 px-2 py-2.5 md:gap-x-2 md:px-4"
            >
              <LockIcon className="size-6 text-grey-400 md:size-4" />
              Privacy Policy
            </Button>
          </div>
        </Dropdown.Item>

        <Dropdown.Item className="p-0">
          <div>
            <Button
              href={urls.tos()}
              target="_blank"
              className="grid grid-cols-auto/1fr items-center gap-x-4 px-2 py-2.5 md:gap-x-2 md:px-4"
            >
              <WorldcoinIcon className="size-6 text-grey-400 md:size-4" />
              Terms of service
            </Button>
          </div>
        </Dropdown.Item>
      </Dropdown.Items>
    </Dropdown>
  );
};
