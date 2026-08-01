export const getSetupIntent = (options: {
  enableRequested: boolean;
  createRequested: boolean;
  hasRpRegistration: boolean;
  hasActiveRp: boolean;
  isStaging: boolean;
  canManageWorldId: boolean;
}) => ({
  openSetup:
    options.canManageWorldId &&
    (options.enableRequested || options.createRequested) &&
    !options.hasRpRegistration,
  openAction:
    options.canManageWorldId && options.createRequested && options.hasActiveRp,
  consumeEnable:
    options.enableRequested &&
    (!options.canManageWorldId ||
      options.hasRpRegistration ||
      options.isStaging),
  consumeCreate:
    options.createRequested && (!options.canManageWorldId || options.isStaging),
});
