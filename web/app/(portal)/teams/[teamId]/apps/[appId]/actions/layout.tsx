import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function Layout(props: Props) {
  return <>{props.children}</>;
}
