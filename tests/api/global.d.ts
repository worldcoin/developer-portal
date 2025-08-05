declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PUBLIC_API_URL: string;
      INTERNAL_API_URL: string;
      INTERNAL_ENDPOINTS_SECRET: string;
    }
  }
}

export { };
