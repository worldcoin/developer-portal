// Global setup for API tests - validates required environment variables

const requiredEnvVars = ["INTERNAL_API_URL"];

beforeAll(() => {
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Required environment variables are not set: ${missingEnvVars.join(", ")}\n` +
        "Please check your environment configuration.",
    );
  }
});
