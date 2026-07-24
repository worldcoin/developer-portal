import type {
  App_Bool_Exp,
  Rp_Registration_Bool_Exp,
  Team_Bool_Exp,
  User_Bool_Exp,
} from "@/graphql/graphql";

export type GlobalSearchTarget = "apps" | "rps" | "teams" | "users";

export type GlobalSearchQuery = {
  appsWhere: App_Bool_Exp;
  rpsWhere: Rp_Registration_Bool_Exp;
  targets: ReadonlySet<GlobalSearchTarget>;
  teamsWhere: Team_Bool_Exp;
  usersWhere: User_Bool_Exp;
};

const entityIdPattern = /^(app|rp|team|user)_[a-f0-9]{4,}$/i;
const fullAppTeamUserIdPattern = /^(app|team|user)_[a-f0-9]{32}$/i;
const fullRpIdPattern = /^rp_[a-f0-9]{16}$/i;

const noResultsWhere = { id: { _eq: "" } };
const noRpResultsWhere = { rp_id: { _eq: "" } };

const hasEmail = (query: string) => query.includes("@");

const getTargets = (query: string): ReadonlySet<GlobalSearchTarget> => {
  const entityIdMatch = query.match(entityIdPattern);

  if (entityIdMatch) {
    const entity = entityIdMatch[1].toLowerCase();
    return new Set([
      (entity === "rp" ? "rps" : `${entity}s`) as GlobalSearchTarget,
    ]);
  }

  return hasEmail(query)
    ? new Set(["users"])
    : new Set(["apps", "rps", "teams", "users"]);
};

const getIdPredicate = (query: string) =>
  fullAppTeamUserIdPattern.test(query) || fullRpIdPattern.test(query)
    ? { _eq: query }
    : { _ilike: `${query}%` };

export const createGlobalSearchQuery = (
  rawQuery: string,
): GlobalSearchQuery => {
  const query = rawQuery.trim();
  const targets = getTargets(query);
  const idPredicate = getIdPredicate(query);

  return {
    appsWhere: targets.has("apps")
      ? entityIdPattern.test(query)
        ? { id: idPredicate }
        : {
            _or: [
              { id: { _ilike: `%${query}%` } },
              { name: { _ilike: `%${query}%` } },
              { team_id: { _ilike: `%${query}%` } },
            ],
          }
      : noResultsWhere,
    rpsWhere: targets.has("rps")
      ? entityIdPattern.test(query) && query.toLowerCase().startsWith("rp_")
        ? { rp_id: idPredicate }
        : entityIdPattern.test(query) && query.toLowerCase().startsWith("app_")
          ? { app_id: idPredicate }
          : {
              _or: [
                { rp_id: { _ilike: `%${query}%` } },
                { app_id: { _ilike: `%${query}%` } },
              ],
            }
      : noRpResultsWhere,
    targets,
    teamsWhere: targets.has("teams")
      ? entityIdPattern.test(query)
        ? { id: idPredicate }
        : {
            _or: [
              { id: { _ilike: `%${query}%` } },
              { name: { _ilike: `%${query}%` } },
            ],
          }
      : noResultsWhere,
    usersWhere: targets.has("users")
      ? entityIdPattern.test(query)
        ? { id: idPredicate }
        : {
            _or: [
              { email: { _ilike: `%${query}%` } },
              { id: { _ilike: `%${query}%` } },
              { name: { _ilike: `%${query}%` } },
            ],
          }
      : noResultsWhere,
  };
};
