"use server";

export const getParameter = async <T = boolean | string | string[]>(
  name: string,
  defaultValue?: T,
): Promise<T | undefined> => {
  return global.ParameterStore?.getParameter<T>(name, defaultValue);
};
