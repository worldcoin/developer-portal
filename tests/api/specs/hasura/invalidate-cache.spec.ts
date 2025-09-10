import axios from "axios";

describe("Hasura API - Invalidate Cache", () => {
  describe("POST /api/hasura/invalidate-cache", () => {
    // Environment variables
    const internalApiUrl = process.env.INTERNAL_API_URL;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
    };
    it("Invalidate Cache with Reviewer Role Successfully", async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/invalidate-cache`,
        {
          action: {
            name: "invalidate_cache",
          },
          input: {},
          session_variables: {
            "x-hasura-role": "reviewer",
            "x-hasura-user-id": "test-user-id",
          },
        },
        { headers },
      );

      expect(
        response.status,
        `Invalidate cache request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`,
      ).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("Invalidate Cache with Admin Role Successfully", async () => {
      const response = await axios.post(
        `${internalApiUrl}/api/hasura/invalidate-cache`,
        {
          action: {
            name: "invalidate_cache",
          },
          input: {},
          session_variables: {
            "x-hasura-role": "admin",
            "x-hasura-user-id": "test-user-id",
          },
        },
        { headers },
      );

      expect(
        response.status,
        `Invalidate cache request resolved with a wrong code:\n${JSON.stringify(response.data, null, 2)}`,
      ).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("Return Error When Invalid Action Name", async () => {
      await expect(
        axios.post(
          `${internalApiUrl}/api/hasura/invalidate-cache`,
          {
            action: {
              name: "invalid_action",
            },
            input: {},
            session_variables: {
              "x-hasura-role": "reviewer",
              "x-hasura-user-id": "test-user-id",
            },
          },
          { headers },
        ),
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            extensions: {
              code: "invalid_action",
            },
          },
        },
      });
    });

    it("Return Error When User Role Is Not Authorized", async () => {
      await expect(
        axios.post(
          `${internalApiUrl}/api/hasura/invalidate-cache`,
          {
            action: {
              name: "invalidate_cache",
            },
            input: {},
            session_variables: {
              "x-hasura-role": "user",
              "x-hasura-user-id": "test-user-id",
            },
          },
          { headers },
        ),
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });

    it("Return Success on Subsequent Requests Within Debounce Period", async () => {
      // First request should succeed
      const firstResponse = await axios.post(
        `${internalApiUrl}/api/hasura/invalidate-cache`,
        {
          action: {
            name: "invalidate_cache",
          },
          input: {},
          session_variables: {
            "x-hasura-role": "reviewer",
            "x-hasura-user-id": "test-user-id",
          },
        },
        { headers },
      );

      expect(firstResponse.status).toBe(200);
      expect(firstResponse.data.success).toBe(true);

      // Second request within debounce period should also succeed (due to debounce logic)
      const secondResponse = await axios.post(
        `${internalApiUrl}/api/hasura/invalidate-cache`,
        {
          action: {
            name: "invalidate_cache",
          },
          input: {},
          session_variables: {
            "x-hasura-role": "reviewer",
            "x-hasura-user-id": "test-user-id",
          },
        },
        { headers },
      );

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.data.success).toBe(true);
    });
  });
});
