import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type TeamIdLayoutProps = {
  params: Promise<Params>;
  children: ReactNode;
};

export const TeamIdLayout = async (props: TeamIdLayoutProps) => {
  // World ID 4.0 is always available now, so there's no rollout flag to
  // hydrate. This layout no longer needs a provider — it just renders children.
  await props.params;

  return <>{props.children}</>;
};
