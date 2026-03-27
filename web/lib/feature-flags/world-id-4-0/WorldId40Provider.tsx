"use client";

import { useSetAtom } from "jotai";
import { Fragment, ReactNode, useEffect } from "react";
import { worldId40Atom } from "./client";

export const WorldId40Provider = (props: {
  children: ReactNode;
  enabledTeams: string[];
}) => {
  const { enabledTeams } = props;
  const setWorldId40Config = useSetAtom(worldId40Atom);

  useEffect(() => {
    setWorldId40Config({
      isFetched: true,
      enabledTeams,
    });
  }, [enabledTeams, setWorldId40Config]);

  return <Fragment>{props.children}</Fragment>;
};
