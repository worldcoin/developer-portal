/* eslint-disable @cspell/spellchecker -- foreign words used */
import axios from "axios";
import {
  createTestApp,
  createTestAppMetadata,
  createTestLocalisation,
  createTestMembership,
  createTestTeam,
  createTestUser,
  deleteTestApp,
  deleteTestAppMetadata,
  deleteTestLocalisation,
  deleteTestMembership,
  deleteTestTeam,
  deleteTestUser,
} from "helpers";

describe("Hasura API - Validate Localisation", () => {
  describe("POST /api/hasura/validate-localisation", () => {
    let testAppId: string;
    let testTeamId: string;
    let testUserId: string;
    let testMembershipId: string;
    let testMetadataId: string;
    let testLocalisationIds: string[] = [];
    let testTeamName: string = "Test Team for Localisation";

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

      // Create test app
      testAppId = await createTestApp("Test App for Localisation", testTeamId);

      // Create test app metadata with supported languages
      const metadata = await createTestAppMetadata(
        testAppId,
        "Test App for Localisation",
        "awaiting_review",
        undefined,
        ["en", "es", "fr"], // Supported languages
      );
      testMetadataId = metadata.id;

      // Create localisations for Spanish and French (required for validation)
      const spanishLocalisationId = await createTestLocalisation(
        testMetadataId,
        "es",
        "Aplicación de Prueba para Localización",
        "App Localización",
        "Descripción de la aplicación de prueba para localización",
        "Descripción de la aplicación de prueba para localización en español",
      );
      testLocalisationIds.push(spanishLocalisationId);

      const frenchLocalisationId = await createTestLocalisation(
        testMetadataId,
        "fr",
        "Application de Test pour Localisation",
        "App Localisation",
        "Description de l'application de test pour localisation",
        "Description de l'application de test pour localisation en français",
      );
      testLocalisationIds.push(frenchLocalisationId);
    });

    it("Validate Complete Localisations Successfully", async () => {
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
        `Validate localisation request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`,
      ).toBe(200);
      expect(response.data.success).toBe(true);
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
      for (const localisationId of testLocalisationIds) {
        await deleteTestLocalisation(localisationId);
      }
      await deleteTestAppMetadata(testMetadataId);
      await deleteTestApp(testAppId);
      await deleteTestMembership(testMembershipId);
      await deleteTestUser(testUserId);
      await deleteTestTeam(testTeamId);
    });
  });
});
