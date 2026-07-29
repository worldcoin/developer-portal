export const CREATE_TEAM_DIALOG_QUERY_PARAM = "createTeam";

export const getCreateTeamDialogStateUrl = (
  pathname: string,
  searchParams: Pick<URLSearchParams, "toString">,
  isOpen: boolean,
) => {
  const nextSearchParams = new URLSearchParams(searchParams.toString());

  if (isOpen) {
    nextSearchParams.set(CREATE_TEAM_DIALOG_QUERY_PARAM, "true");
  } else {
    nextSearchParams.delete(CREATE_TEAM_DIALOG_QUERY_PARAM);
  }

  const query = nextSearchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
};
