import axios from "axios";

const PUBLIC_API_URL = process.env.PUBLIC_API_URL;
const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;

describe("Public API Endpoints", () => {
  describe("GET /api/v2/public/apps and GET /api/v2/public/app/[app_id]", () => {
    it("Get Apps List And Fetch Specific App Details", async () => {
      // First, get the list of public apps
      const appsResponse = await axios.get(
        `${PUBLIC_API_URL}/api/v2/public/apps`
      );

      expect(appsResponse.status).toBe(200);
      expect(appsResponse.data).toEqual(
        expect.objectContaining({
          app_rankings: expect.objectContaining({
            top_apps: expect.any(Array),
            highlights: expect.any(Array),
          }),
          all_category: expect.objectContaining({
            name: "All",
            id: "all",
            icon_url: expect.stringMatching(/^https?:\/\/.*\.png$/),
          }),
          categories: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              icon_url: expect.stringMatching(/^https?:\/\/.*\.png$/),
            }),
          ]),
        })
      );

      // Get an app_id from the top_apps array
      const topApps = appsResponse.data.app_rankings.top_apps;
      expect(topApps.length).toBeGreaterThan(0);

      // Use the first app from top_apps to test the specific app endpoint
      const firstApp = topApps[0];
      expect(firstApp).toEqual(
        expect.objectContaining({
          app_id: expect.any(String),
        })
      );

      const appId = firstApp.app_id;

      // Now test the specific app endpoint with the obtained app_id
      const appResponse = await axios.get(
        `${PUBLIC_API_URL}/api/v2/public/app/${appId}`
      );

      expect(appResponse.status).toBe(200);
      expect(appResponse.data).toEqual(
        expect.objectContaining({
          app_data: expect.objectContaining({
            app_id: appId,
            name: expect.stringMatching(/.+/), // non-empty string
            description: expect.objectContaining({
              overview: expect.any(String),
            }),
          }),
        })
      );

      // Check headers for specific app
      expect(appResponse.headers).toEqual(
        expect.objectContaining({
          "content-type": expect.stringContaining("application/json"),
        })
      );
    });

    it("Return 404 For Non-Existent App ID", async () => {
      const nonExistentAppId = "non_existent_app_12345";
      try {
        await axios.get(
          `${PUBLIC_API_URL}/api/v2/public/app/${nonExistentAppId}`
        );
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response).toEqual(
          expect.objectContaining({
            status: 404,
          })
        );
      }
    });
  });

  it("Get App Details By App ID", async () => {
    const appId = APP_ENV === "staging" ? "grants" : "grants";
    const response = await axios.get(
      `${PUBLIC_API_URL}/api/v2/public/app/${appId}?metadata_field=name`
    );
    expect(response.status).toBe(200);
    expect(response.data).toEqual("Worldcoin");
  });

  describe("GET /api/v2/public/apps/search/[search_term]", () => {
    it("Return Apps Matching Search Term", async () => {
      const searchTerm = "grants"; // real search term that should exist in staging
      const response = await axios.get(
        `${PUBLIC_API_URL}/api/v2/public/apps/search/${searchTerm}`
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual(
        expect.objectContaining({
          app_ids: expect.arrayContaining([expect.any(String)]),
        })
      );

      // Check headers separately
      expect(response.headers).toEqual(
        expect.objectContaining({
          "content-type": expect.stringContaining("application/json"),
        })
      );
    });

    it("Return Empty Results For Non-Matching Search Term", async () => {
      const searchTerm = "non_existing_search_term_12345";
      const response = await axios.get(
        `${PUBLIC_API_URL}/api/v2/public/apps/search/${searchTerm}`
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual(
        expect.objectContaining({
          app_ids: expect.any(Array),
        })
      );

      // Check that app_ids array is empty for non-matching search
      expect(response.data.app_ids).toEqual([]);

      // Check headers separately
      expect(response.headers).toEqual(
        expect.objectContaining({
          "content-type": expect.stringContaining("application/json"),
        })
      );
    });
  });
});
