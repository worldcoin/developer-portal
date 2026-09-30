/* eslint-disable @cspell/spellchecker -- foreign words used */
import axios from "axios";
import {
  createTestApp,
  createTestAppMetadata,
  createTestLocalization,
  createTestMembership,
  createTestTeam,
  createTestUser,
  deleteTestApp,
  deleteTestAppMetadata,
  deleteTestLocalization,
  deleteTestMembership,
  deleteTestTeam,
  deleteTestUser,
} from "helpers";

describe("Hasura API - Validate Localization", () => {
  describe("POST /api/hasura/validate-localisation", () => {
    let testAppId: string;
    let testTeamId: string;
    let testUserId: string;
    let testMembershipId: string;
    let memberUserId: string;
    let memberMembershipId: string;
    let testMetadataId: string;
    let otherTeamId: string;
    let otherUserId: string;
    let otherMembershipId: string;
    let testLocalizationIds: string[] = [];
    let testTeamName: string = "Test Team for Localization";

    // Environment variables
    const internalApiUrl = process.env.INTERNAL_API_URL;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    };

    beforeAll(async () => {
      // Create test team and user
      testTeamId = await createTestTeam(testTeamName);
      testUserId = await createTestUser("validator@example.com", testTeamId);

      // Create membership for user in team with OWNER role
      testMembershipId = await createTestMembership(
        testUserId,
        testTeamId,
        "OWNER",
      );
      memberUserId = await createTestUser(
        "member-validator@example.com",
        testTeamId,
      );
      memberMembershipId = await createTestMembership(
        memberUserId,
        testTeamId,
        "MEMBER",
      );
      otherTeamId = await createTestTeam("Other Team for Localization");
      otherUserId = await createTestUser(
        "other-validator@example.com",
        otherTeamId,
      );
      otherMembershipId = await createTestMembership(
        otherUserId,
        otherTeamId,
        "OWNER",
      );

      // Create test app
      testAppId = await createTestApp("Test App for Localization", testTeamId);

      // Create test app metadata with supported languages
      const metadata = await createTestAppMetadata(
        testAppId,
        "Test App for Localization",
        "awaiting_review",
        undefined,
        ["en", "es", "fr"], // Supported languages
      );
      testMetadataId = metadata.id;

      // Create localizations for Spanish and French (required for validation)
      const spanishLocalizationId = await createTestLocalization(
        testMetadataId,
        "es",
        "Aplicación de Prueba para Localización",
        "App Localización",
        "Descripción de la aplicación de prueba para localización",
        "Descripción de la aplicación de prueba para localización en español",
      );
      testLocalizationIds.push(spanishLocalizationId);

      const frenchLocalizationId = await createTestLocalization(
        testMetadataId,
        "fr",
        "Application de Test pour Localisation",
        "App Localisation",
        "Description de l'application de test pour localisation",
        "Description de l'application de test pour localisation en français",
      );
      testLocalizationIds.push(frenchLocalizationId);
    });

    it("Validate Complete Localizations Successfully", async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/validate-localisation?app_metadata_id=${testMetadataId}&team_id=${testTeamId}`,
        {
          action: {
            name: "validate_localisation",
          },
          input: {},
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": testUserId,
          },
        },
        { headers },
      );

      expect(
        response.status,
        `Validate localization request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`,
      ).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("Allows a member of the app's team to validate localisations", async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/validate-localisation?app_metadata_id=${testMetadataId}&team_id=${testTeamId}`,
        {
          action: { name: "validate_localisation" },
          input: {},
          session_variables: {
            "x-hasura-role": "user",
            "x-hasura-user-id": memberUserId,
          },
        },
        { headers },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("Rejects a user from another team before checking localizations", async () => {
      await expect(
        axios.post(
          `${internalApiUrl}/api/hasura/validate-localisation?app_metadata_id=${testMetadataId}&team_id=${testTeamId}`,
          {
            action: { name: "validate_localisation" },
            input: {},
            session_variables: {
              "x-hasura-role": "user",
              "x-hasura-user-id": otherUserId,
            },
          },
          { headers },
        ),
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: { extensions: { code: "not_found" } },
        },
      });
    });

    it("Rejects a team ID that does not own the metadata", async () => {
      await expect(
        axios.post(
          `${internalApiUrl}/api/hasura/validate-localisation?app_metadata_id=${testMetadataId}&team_id=${otherTeamId}`,
          {
            action: { name: "validate_localisation" },
            input: {},
            session_variables: {
              "x-hasura-role": "user",
              "x-hasura-user-id": testUserId,
            },
          },
          { headers },
        ),
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: { extensions: { code: "not_found" } },
        },
      });
    });

    it("Return Error When App Metadata ID Is Missing", async () => {
      await expect(
        axios.post(
          `${internalApiUrl}/api/hasura/validate-localisation?team_id=${testTeamId}`,
          {
            action: {
              name: "validate_localisation",
            },
            input: {},
            session_variables: {
              "x-hasura-role": "user",
              "x-hasura-user-id": testUserId,
            },
          },
          { headers },
        ),
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            extensions: {
              code: "invalid_request",
            },
          },
        },
      });
    });

    it("Return Error When Team ID Is Missing", async () => {
      await expect(
        axios.post(
          `${internalApiUrl}/api/hasura/validate-localisation?app_metadata_id=${testMetadataId}`,
          {
            action: {
              name: "validate_localisation",
            },
            input: {},
            session_variables: {
              "x-hasura-role": "user",
              "x-hasura-user-id": testUserId,
            },
          },
          { headers },
        ),
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            extensions: {
              code: "invalid_request",
            },
          },
        },
      });
    });

    afterAll(async () => {
      // Clean up test data
      for (const localizationId of testLocalizationIds) {
        await deleteTestLocalization(localizationId);
      }
      await deleteTestAppMetadata(testMetadataId);
      await deleteTestApp(testAppId);
      await deleteTestMembership(testMembershipId);
      await deleteTestMembership(memberMembershipId);
      await deleteTestMembership(otherMembershipId);
      await deleteTestUser(testUserId);
      await deleteTestUser(memberUserId);
      await deleteTestUser(otherUserId);
      await deleteTestTeam(testTeamId);
      await deleteTestTeam(otherTeamId);
    });
  });
});
