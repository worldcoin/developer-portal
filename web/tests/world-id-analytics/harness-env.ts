export const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required by the fresh-stack harness`);
  return value;
};
