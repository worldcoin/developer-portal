"use client";

import { useSetAtom } from "jotai";
import { Fragment, ReactNode, useEffect } from "react";
import { portalV3Atom } from "./client";

export const PortalV3Provider = (props: {
  children: ReactNode;
  enabledTeams: string[];
}) => {
  const { enabledTeams } = props;
  const setPortalV3Config = useSetAtom(portalV3Atom);

  useEffect(() => {
    setPortalV3Config({
      isFetched: true,
      enabledTeams,
    });
  }, [enabledTeams, setPortalV3Config]);

  return <Fragment>{props.children}</Fragment>;
};
