import { Dropdown } from "components/Dropdown";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { HelpIcon } from "@/components/Icons/HelpIcon";
import { LockIcon } from "@/components/Icons/LockIcon";
import { SecurityIcon } from "@/components/Icons/SecurityIcon";
import { SubtractIcon } from "@/components/Icons/SubtractIcon";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
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
import Link from "next/link";

export const Help = () => {
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
    <>
      <Dropdown.ListHeader>Need help with your app?</Dropdown.ListHeader>

      <Dropdown.ListItem asChild>
        <Link
          href={WORLDCOIN_PRIVACY_URL}
          onClick={() => trackHelpClick("worldcoin_privacy")}
        >
          <Dropdown.ListItemIcon asChild>
            <SecurityIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>Data Privacy & Security</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>

      <Dropdown.ListItem asChild>
        <Link
          href={WORLDCOIN_STATUS_URL}
          onClick={() => trackHelpClick("worldcoin_status")}
        >
          <Dropdown.ListItemIcon asChild>
            <SubtractIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>Worldcoin Status</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>

      <Dropdown.ListItem asChild>
        <Link href={FAQ_URL} onClick={() => trackHelpClick("faq")}>
          <Dropdown.ListItemIcon asChild>
            <HelpIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>FAQ</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>

      <Dropdown.ListSeparator />

      <Dropdown.ListHeader>Community support</Dropdown.ListHeader>

      <Dropdown.ListItem asChild>
        <Link href={DISCORD_URL} onClick={() => trackHelpClick("discord")}>
          <Dropdown.ListItemIcon asChild>
            <DiscordIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>Join our Discord</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>

      <Dropdown.ListItem asChild>
        <Link
          href={GITHUB_ISSUES_URL}
          onClick={() => trackHelpClick("github_issues")}
        >
          <Dropdown.ListItemIcon asChild>
            <GithubIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>GitHub Issues</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>

      <Dropdown.ListSeparator />

      <Dropdown.ListHeader>References</Dropdown.ListHeader>

      <Dropdown.ListItem asChild>
        <Link href={urls.privacyStatement()} target="_blank">
          <Dropdown.ListItemIcon asChild>
            <LockIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>Privacy Policy</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>

      <Dropdown.ListItem asChild>
        <Link href={urls.tos()} target="_blank">
          <Dropdown.ListItemIcon asChild>
            <WorldcoinIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>Terms of service</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>
    </>
  );
};
