import { deleteUser } from "@e2e/helpers/hasura/user";
import { deleteTeam } from "@e2e/helpers/hasura/team";
import { deleteMembership } from "./helpers/hasura/membership/delete-membership";

export default async function globalTeardown() {
  await deleteMembership(process.env.TEST_MEMBERSHIP_ID!);
  await deleteUser(process.env.TEST_USER_ID!);
  await deleteTeam(process.env.TEST_TEAM_ID!);
}
