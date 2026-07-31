"use client";

import { useParams } from "next/navigation";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AppNavigationContextValue = {
  teamId?: string;
  appId?: string;
};

const AppNavigationContext = createContext<AppNavigationContextValue | null>(
  null,
);

/**
 * Keeps the app selected by an app-scoped URL available while visiting a
 * team-scoped page such as Team settings. The portal shell stays mounted over
 * that navigation, so it is the natural owner for this short-lived context.
 */
export const AppNavigationProvider = (props: { children: ReactNode }) => {
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const routeAppId = params?.appId;
  const [lastAppRoute, setLastAppRoute] = useState<AppNavigationContextValue>(
    {},
  );

  useEffect(() => {
    if (teamId && routeAppId) {
      setLastAppRoute({ teamId, appId: routeAppId });
      return;
    }

    // Never carry an app into a different team. A direct visit to a team route
    // therefore remains an app-less experience until its URL selects an app.
    if (teamId && lastAppRoute.teamId !== teamId) {
      setLastAppRoute({ teamId });
    }
  }, [lastAppRoute.teamId, routeAppId, teamId]);

  const value = useMemo<AppNavigationContextValue>(() => {
    if (teamId && routeAppId) return { teamId, appId: routeAppId };

    return lastAppRoute.teamId === teamId ? lastAppRoute : { teamId };
  }, [lastAppRoute, routeAppId, teamId]);

  return (
    <AppNavigationContext.Provider value={value}>
      {props.children}
    </AppNavigationContext.Provider>
  );
};

export const useNavigationAppContext = () => {
  const params = useParams<{ teamId?: string; appId?: string }>();
  const value = useContext(AppNavigationContext);

  // This fallback keeps isolated layout components usable in tests and in any
  // future surface rendered outside the portal shell.
  if (!value) {
    return { teamId: params?.teamId, appId: params?.appId };
  }

  return value;
};
