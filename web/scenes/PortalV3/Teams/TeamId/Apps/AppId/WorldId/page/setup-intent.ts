export const getSetupIntent = (options: {
  enableRequested: boolean;
  createRequested: boolean;
  hasRpRegistration: boolean;
  hasActiveRp: boolean;
  isStaging: boolean;
}) => ({
  openSetup:
    (options.enableRequested || options.createRequested) &&
    !options.hasRpRegistration,
  openAction: options.createRequested && options.hasActiveRp,
  consumeEnable:
    options.enableRequested && (options.hasRpRegistration || options.isStaging),
  consumeCreate:
    options.createRequested &&
    (options.isStaging || (options.hasRpRegistration && !options.hasActiveRp)),
});
