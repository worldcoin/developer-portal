import { loadEnvConfig } from "@next/env";

export default () => {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
};
