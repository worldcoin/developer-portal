"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
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
import { useParams } from "next/navigation";
import posthog from "posthog-js";

const itemClass = "h-10 cursor-pointer gap-3 text-portal-text focus:bg-grey-50";
const labelClass = "px-2 py-1.5 text-portal-subtle";

const HelpLink = (props: {
  href: string;
  label: string;
  icon: string;
  onSelect: () => void;
}) => (
  <DropdownMenuItem asChild className={itemClass}>
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      onClick={props.onSelect}
    >
      <Icon name={props.icon} className={`${opticalIconClassName} size-4`} />
      <span className="min-w-0 flex-1 truncate">{props.label}</span>
    </a>
  </DropdownMenuItem>
);

/** Single home for documentation, support, community, and legal links. */
export const HelpCenterMenu = () => {
  const params = useParams<{
    teamId?: string;
    appId?: string;
    actionId?: string;
  }>();
  const { isMobile } = useSidebar();

  const track = (destination: string) => () => {
    posthog.capture("clicked_help", {
      helpLink: destination,
      teamId: params?.teamId,
      appId: params?.appId,
      actionId: params?.actionId,
    });
  };

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            aria-label="Help center"
            title="Help center"
            className="h-10 rounded-[10px] px-3 font-world text-13 leading-none text-portal-muted hover:bg-portal-border hover:text-portal-text"
          >
            <Icon
              name="nav-help"
              className={`${opticalIconClassName} size-4`}
            />
            <span>Help center</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={12}
          collisionPadding={16}
          className="w-72 border border-portal-border font-world"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className={labelClass}>
              Need help with your app?
            </DropdownMenuLabel>
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
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-2 bg-portal-border" />

          <DropdownMenuGroup>
            <DropdownMenuLabel className={labelClass}>
              Community support
            </DropdownMenuLabel>
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
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-2 bg-portal-border" />

          <DropdownMenuGroup>
            <DropdownMenuLabel className={labelClass}>
              References
            </DropdownMenuLabel>
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
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};
