import axios from "axios";
import { deleteTestTeam } from "helpers";
import { createAppSession } from "helpers/auth0";

describe.skip("Team Actions", () => {
  const INTERNAL_API_URL = process.env.INTERNAL_API_URL;
  let cleanUpFunctions: Array<() => Promise<unknown>> = [];
  let sessionCookie: string;

  beforeAll(async () => {
    if (!INTERNAL_API_URL) {
      throw new Error("INTERNAL_API_URL environment variable is not set!");
    }

    sessionCookie = await createAppSession({
      user: {
        sub: process.env.TEST_USER_AUTH0_ID,
        hasura: {
          id: process.env.TEST_USER_HASURA_ID,
        },
      },
    });
  });

  afterEach(async () => {
    await cleanUpFunctions.reduce<Promise<unknown>>(
      (promise, callback) => promise.then(() => callback()),
      Promise.resolve()
    );

    cleanUpFunctions = [];
  });

  it("Create a team", async () => {
    const response = await axios.post(
      `${INTERNAL_API_URL}/api/create-team`,
      {
        team_name: "My team 1",
        hasUser: true,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        validateStatus: () => true,
      }
    );

    const body = response.data;
    expect(
      response.status,
      `Create Team response body: ${JSON.stringify(body)}`
    ).toBe(200);

    if (body.returnTo && typeof body.returnTo === "string") {
      cleanUpFunctions.push(async () => {
        const teamId = response.data.returnTo.split("/teams/")[1];
        await deleteTestTeam(teamId);
      });
    }
  });
});
