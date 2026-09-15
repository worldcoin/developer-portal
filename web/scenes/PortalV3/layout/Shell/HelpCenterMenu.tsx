"use client";

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
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
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDownIcon } from "lucide-react";
import { portalMenuItemClassName } from "@/lib/portal-menu-styles";

const itemClass = portalMenuItemClassName;
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

/** Documentation, support, community, and legal links inside the user menu. */
export const HelpCenterMenu = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
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

  const content = (
    <>
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
      </DropdownMenuGroup>

      <DropdownMenuSeparator className="my-2 bg-portal-border" />

      <DropdownMenuGroup>
        <DropdownMenuLabel className={labelClass}>References</DropdownMenuLabel>
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
    </>
  );

  // A side-opening submenu cannot fit beside the mobile sidebar. Expand
  // within the parent menu so its existing height limit handles scrolling.
  if (isMobile)
    return (
      <>
        <DropdownMenuItem
          className={itemClass}
          aria-expanded={open}
          onSelect={(event) => {
            event.preventDefault();
            setOpen((value) => !value);
          }}
        >
          <Icon name="nav-help" className={`${opticalIconClassName} size-4`} />
          <span className="min-w-0 flex-1 truncate">Help center</span>
          <ChevronDownIcon
            className={`ml-auto size-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </DropdownMenuItem>
        {open && (
          <DropdownMenuGroup
            aria-label="Help center links"
            className="border-y border-portal-border py-1"
          >
            {content}
          </DropdownMenuGroup>
        )}
      </>
    );

  return (
    <DropdownMenuSub open={open} onOpenChange={setOpen}>
      <DropdownMenuSubTrigger
        aria-label="Help center"
        className={itemClass}
        chevronClassName={`${opticalIconClassName} size-4`}
        onPointerEnter={() => setOpen(true)}
      >
        <Icon name="nav-help" className={`${opticalIconClassName} size-4`} />
        <span className="min-w-0 flex-1 truncate">Help center</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent
          sideOffset={8}
          collisionPadding={16}
          className="w-72 border border-portal-border font-world"
        >
          {content}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};
