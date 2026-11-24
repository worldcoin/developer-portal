const FACE_CHECK_ENABLED_APPS_PARAMETER = "whitelisted-apps/face-check";

export async function getFaceCheckEnabledApps(): Promise<readonly string[]> {
  const enabledApps = await global.ParameterStore?.getParameter<string[]>(
    FACE_CHECK_ENABLED_APPS_PARAMETER,
    [],
    { cacheNotFound: true, timeoutMs: 3000 },
  );
  return Array.isArray(enabledApps) ? enabledApps : [];
}

export async function isFaceCheckEnabled(appId: string): Promise<boolean> {
  return (await getFaceCheckEnabledApps()).includes(appId);
}
