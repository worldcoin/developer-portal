import { ReactNode } from "react";

export const OnboardingLayout = (props: { children: ReactNode }) => (
  <div className="p-4">{props.children}</div>
);
