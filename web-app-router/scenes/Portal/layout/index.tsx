import { urls } from "@/lib/urls";
import { ReactNode } from "react";

export const PortalLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <header className="flex justify-between items-center p-4 border border-black w-full">
        <span>Logo</span>
        <a className="hover:opacity-60 transition" href={urls.logout()}>
          Logout
        </a>
      </header>

      <div>{props.children}</div>
    </div>
  );
};
