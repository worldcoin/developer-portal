import { createTeam } from "@e2e/helpers/hasura/team";
import { createUser } from "@e2e/helpers/hasura/user";
import { createMembership } from "./helpers/hasura/membership";
import { Role_Enum } from "@/graphql/graphql";
import { CleanUpMutation, cleanUpSdk } from "./graphql/clean-up";
import { adminGraphqlClient } from "./helpers/hasura";
import crypto from "crypto";
import { constants } from "@e2e/helpers";

export default async function globalSetup() {
  if (
    !process.env.NEXT_PUBLIC_GRAPHQL_API_URL ||
    !process.env.HASURA_GRAPHQL_ADMIN_SECRET
  ) {
    throw new Error("Hasura credentials are missing!");
  }

  const email = process.env.TEST_USER_EMAIL;
  const auth0Id = process.env.TEST_USER_AUTH0_ID;
  const teamName = "Automated test team";

  if (!email || !auth0Id) {
    throw new Error("Test user credentials are missing!");
  }

  console.log(
    "\x1b[36m",
    "\nCleaning up test data in Hasura before the start...",
    "\x1b[0m",
  );

  let cleanUpResponse: CleanUpMutation;

  try {
    cleanUpResponse = await cleanUpSdk(adminGraphqlClient).CleanUp({
      name: teamName + "%",
      email,
    });
  } catch (e) {
    throw new Error(
      `Failed to clean up team (${teamName}) and user (${email}) in Hasura: \
        \n${JSON.stringify(e, null, 2)}`,
    );
  }

  let resultDeleteUser, resultDeleteTeam: any;

  try {
    resultDeleteUser = cleanUpResponse.delete_user?.affected_rows;
    resultDeleteTeam = cleanUpResponse.delete_team?.affected_rows;
  } catch {}

  if (resultDeleteUser) {
    console.log(
      "\x1b[32m%s\x1b[0m",
      `Deleted ${resultDeleteUser} users`,
      "\x1b[0m",
    );
  } else {
    console.log("\x1b[32m%s\x1b[0m", "No test users found", "\x1b[0m");
  }

  if (resultDeleteTeam) {
    console.log(
      "\x1b[32m%s\x1b[0m",
      `Deleted ${resultDeleteTeam} teams`,
      "\x1b[0m",
    );
  } else {
    console.log("\x1b[32m%s\x1b[0m", "No test teams found", "\x1b[0m");
  }

  await createTeam({
    name: teamName + ` ${crypto.randomBytes(4).toString("hex")}`,
    id: constants.teamId,
  });

  await createUser({
    auth0Id,
    email,
    teamId: constants.teamId,
    userId: constants.userId,
  });

  await createMembership({
    teamId: constants.teamId,
    userId: constants.userId,
    membershipId: constants.membershipId,
    role: Role_Enum.Owner,
  });
}
