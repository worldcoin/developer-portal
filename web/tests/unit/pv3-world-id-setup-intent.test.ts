import { getSetupIntent } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/setup-intent";

const defaults = {
  enableRequested: false,
  createRequested: true,
  hasRpRegistration: false,
  hasActiveRp: false,
  isStaging: false,
};

it("routes create-action intents to the correct dialog", () => {
  expect(getSetupIntent(defaults)).toMatchObject({
    openSetup: true,
    openAction: false,
  });

  expect(
    getSetupIntent({
      ...defaults,
      hasRpRegistration: true,
      hasActiveRp: true,
    }),
  ).toMatchObject({ openSetup: false, openAction: true });
});
