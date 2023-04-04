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
        text="It verifies that a person is doing an action only once and ensures unlinkable actions for enhanced privacy, as in voting applications."
        linkText="Learn more about Worldcoin sign-in"
        linkHref="https://docs.worldcoin.org/id/sign-in"
      />
    </div>
  );
});
