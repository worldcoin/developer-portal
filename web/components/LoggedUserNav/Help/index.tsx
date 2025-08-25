import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { HelpIcon } from "@/components/Icons/HelpIcon";
import { LockIcon } from "@/components/Icons/LockIcon";
import { SecurityIcon } from "@/components/Icons/SecurityIcon";
import { SubtractIcon } from "@/components/Icons/SubtractIcon";
import { TelegramIcon } from "@/components/Icons/TelegramIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import {
  DISCORD_URL,
  FAQ_URL,
  TELEGRAM_DEVELOPERS_GROUP_URL,
  TELEGRAM_MATEO_URL,
  WORLD_PRIVACY_URL,
  WORLD_STATUS_URL,
} from "@/lib/constants";
import { urls } from "@/lib/urls";
import { Dropdown } from "components/Dropdown";
import Link from "next/link";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { useCallback } from "react";

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
          href={WORLD_PRIVACY_URL}
          onClick={() => trackHelpClick("world_privacy")}
        >
          <Dropdown.ListItemIcon asChild>
            <SecurityIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>Data Privacy & Security</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>

      <Dropdown.ListItem asChild>
        <Link
          href={WORLD_STATUS_URL}
          onClick={() => trackHelpClick("world_status")}
        >
          <Dropdown.ListItemIcon asChild>
            <SubtractIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>World Status</Dropdown.ListItemText>
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
        <Link
          href={TELEGRAM_DEVELOPERS_GROUP_URL}
          onClick={() => trackHelpClick("telegram_group")}
        >
          <Dropdown.ListItemIcon asChild>
            <TelegramIcon className="grayscale" />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>Join our Telegram</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>

      <Dropdown.ListItem asChild>
        <Link
          href={TELEGRAM_MATEO_URL}
          onClick={() => trackHelpClick("telegram_mateo")}
        >
          <Dropdown.ListItemIcon asChild>
            <TelegramIcon className="grayscale" />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>Text Mateo</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>

      <Dropdown.ListItem asChild>
        <Link href={DISCORD_URL} onClick={() => trackHelpClick("discord")}>
          <Dropdown.ListItemIcon asChild>
            <DiscordIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>Join our Discord</Dropdown.ListItemText>
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
            <WorldIcon />
          </Dropdown.ListItemIcon>

          <Dropdown.ListItemText>Terms of service</Dropdown.ListItemText>
        </Link>
      </Dropdown.ListItem>
    </>
  );
};
