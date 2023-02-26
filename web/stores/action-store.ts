import { CustomAction, customActions } from "common/Layout/temp-data";
import { create } from "zustand";

type States = {
  actions: Array<CustomAction>;
};

export const useActionStore = create<States>(() => ({
  actions: customActions,
}));

export const fetchActions = async () => {
  const actions = customActions;
  return useActionStore.setState({ actions });
};
