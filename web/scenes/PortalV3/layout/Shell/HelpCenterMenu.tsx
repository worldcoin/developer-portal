"use client";

import {
  DISCORD_URL,
  DOCS_URL,
  FAQ_URL,
  TELEGRAM_DEVELOPERS_GROUP_URL,
  TELEGRAM_MATEO_URL,
  WORLD_PRIVACY_URL,
  WORLD_STATUS_URL,
} from "@/lib/constants";
import { urls } from "@/lib/urls";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { ReactNode } from "react";
import { sidebarNavItemClassName } from "./NavItem";

const itemClass =
  "flex h-11 w-full cursor-pointer items-center gap-3 rounded-8 px-3 font-world text-13 font-medium text-portal-text outline-hidden transition-colors data-highlighted:bg-grey-50";

const HelpLink = (props: {
  href: string;
  label: string;
  icon: string;
  onSelect: () => void;
}) => (
  <DropdownMenu.Item asChild>
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className={itemClass}
      onClick={props.onSelect}
    >
      <Icon name={props.icon} className={`${opticalIconClassName} size-4`} />
      <span className="min-w-0 flex-1 truncate">{props.label}</span>
    </a>
  </DropdownMenu.Item>
);

const Section = (props: { title: string; children: ReactNode }) => (
  <section className="grid gap-1 px-2 py-2">
    <p className="px-3 pt-2 pb-1 font-world text-12 font-medium text-portal-subtle">
      {props.title}
    </p>
    {props.children}
  </section>
);

const Separator = () => <div className="h-px bg-portal-border" />;

/** Single home for documentation, support, community, and legal links. */
export const HelpCenterMenu = () => {
  const params = useParams<{
    teamId?: string;
    appId?: string;
    actionId?: string;
  }>();

  const track = (destination: string) => () => {
    posthog.capture("clicked_help", {
      helpLink: destination,
      teamId: params?.teamId,
      appId: params?.appId,
      actionId: params?.actionId,
    });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={sidebarNavItemClassName()}
        aria-label="Help center"
      >
        <Icon name="nav-help" className={`${opticalIconClassName} size-4`} />
        <span className="min-w-0 flex-1 truncate text-left">Help center</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          align="end"
          sideOffset={12}
          collisionPadding={16}
          className="z-50 max-h-(--radix-dropdown-menu-content-available-height) w-[300px] overflow-y-auto rounded-[12px] border border-portal-border bg-white shadow-[0_18px_30px_rgba(24,24,24,0.12)]"
        >
          <Section title="Need help with your app?">
            <HelpLink
              href={DOCS_URL}
              label="Documentation"
              icon="profile-menu-docs"
              onSelect={track("documentation")}
            />
            <HelpLink
              href={FAQ_URL}
              label="FAQ"
              icon="profile-menu-help"
              onSelect={track("faq")}
            />
            <HelpLink
              href={WORLD_PRIVACY_URL}
              label="Data Privacy & Security"
              icon="profile-menu-privacy"
              onSelect={track("world_privacy")}
            />
            <HelpLink
              href={WORLD_STATUS_URL}
              label="World Status"
              icon="profile-menu-status"
              onSelect={track("world_status")}
            />
          </Section>

          <Separator />

          <Section title="Community support">
            <HelpLink
              href={TELEGRAM_DEVELOPERS_GROUP_URL}
              label="Join our Telegram"
              icon="profile-menu-telegram"
              onSelect={track("telegram_group")}
            />
            <HelpLink
              href={TELEGRAM_MATEO_URL}
              label="Text Mateo"
              icon="profile-menu-message"
              onSelect={track("telegram_mateo")}
            />
            <HelpLink
              href={DISCORD_URL}
              label="Join our Discord"
              icon="profile-menu-discord"
              onSelect={track("discord")}
            />
          </Section>

          <Separator />

          <Section title="References">
            <HelpLink
              href={urls.privacyStatement()}
              label="Privacy Policy"
              icon="profile-menu-policy"
              onSelect={track("privacy_policy")}
            />
            <HelpLink
              href={urls.tos()}
              label="Terms of service"
              icon="profile-menu-terms"
              onSelect={track("terms_of_service")}
            />
          </Section>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
