import { ListFilter } from "logics/actionsLogic";
import { AppType } from "types";

type Props = {
  apps: Array<AppType>;
  listFilter: ListFilter;
  listFilterApplied: boolean;
};

export const filterApps = ({
  apps,
  listFilter,
  listFilterApplied,
}: Props): Array<AppType> => {
  const searchQuery = listFilter.search_query?.toLowerCase() || "";

  const isDesiredAction = (action: AppType["actions"][0]) => {
    const satisfiesArchivedCondition =
      listFilter.show_archived || !action.is_archived;

    const satisfiesSearchCondition =
      action.name.toLowerCase().includes(searchQuery) ||
      action.description.toLowerCase().includes(searchQuery);

    const satisfiesStatusCondition =
      listFilter.status === "all" ||
      (listFilter.status === "staging" && action.is_staging) ||
      (listFilter.status === "production" && !action.is_staging);

    if (
      !satisfiesArchivedCondition ||
      !satisfiesSearchCondition ||
      !satisfiesStatusCondition
    ) {
      return false;
    }

    return true;
  };

  if (!listFilterApplied) {
    return apps.map((app) => ({
      ...app,
      actions: app.actions.filter((action) => !action.is_archived),
    }));
  }

  if (listFilter.app_id && !listFilterApplied) {
    return apps.filter((app) => listFilter.app_id === app.id);
  }

  if (listFilter.app_id && listFilterApplied) {
    const app = apps.find((app) => listFilter.app_id === app.id);

    if (!app) {
      return [];
    }

    return [
      {
        ...app,
        actions: app?.actions.filter((action) => isDesiredAction(action)),
      },
    ];
  }

  return apps
    .filter((app) => app.actions.some((action) => isDesiredAction(action)))
    .map((app) => ({
      ...app,
      actions: app.actions.filter((action) => isDesiredAction(action)),
    }));
};
