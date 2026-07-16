import { getSetupIntent } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/setup-intent";

const defaults = {
  enableRequested: false,
  createRequested: true,
  hasRpRegistration: false,
  hasActiveRp: false,
  isStaging: false,
  canManageWorldId: true,
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

it("preserves pending create intent and rejects unauthorized setup", () => {
  expect(
    getSetupIntent({ ...defaults, hasRpRegistration: true }).consumeCreate,
  ).toBe(false);
  expect(
    getSetupIntent({ ...defaults, canManageWorldId: false }),
  ).toMatchObject({ openSetup: false, consumeCreate: true });
});
