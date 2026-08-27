import { getListingDestinationName } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/SubmitAppModal/listing-copy";

describe("listing review modal copy", () => {
  it("names the Mini App Store for Mini Apps", () => {
    expect(getListingDestinationName("mini-app")).toBe("Mini App Store");
  });

  it("names the World ecosystem directory for external integrations", () => {
    expect(getListingDestinationName("external")).toBe(
      "World ecosystem directory",
    );
  });
});
