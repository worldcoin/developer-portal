import { deleteUser } from "@e2e/helpers/hasura/user";
import { deleteTeam } from "@e2e/helpers/hasura/team";
import { deleteMembership } from "@e2e/helpers/hasura/membership";
import { constants } from "@e2e/helpers";

export default async function globalTeardown() {
  await deleteMembership(constants.membershipId);
  await deleteUser(constants.userId);
  await deleteTeam(constants.teamId);
}
