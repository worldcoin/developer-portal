export type AppLayoutParams = {
  teamId: string;
  appId: string;
};

export type AppLayoutRouteParams = AppLayoutParams | Promise<AppLayoutParams>;
