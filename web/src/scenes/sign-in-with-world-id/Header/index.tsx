import { memo } from "react";
import { PageInfo } from "@/components/PageInfo";

export const Header = memo(function Header() {
  return (
    <div className="grid gap-y-3">
      <h1 className="font-sora text-24 font-semibold leading-tight">Sign In</h1>
      <PageInfo
        icon="world-id-sign-in"
        iconClassName="text-primary"
        title="Sign in with Worldcoin"
        text="Let users sign in to your app with their World ID using OpenID Connect (OIDC), the open standard for web authentication."
        linkText="Tech Docs"
        linkHref="https://docs.worldcoin.org/id/sign-in"
      />
    </div>
  );
});
