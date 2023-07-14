let counter = 0;
const TIMEOUT = 2000; // 2 seconds
const MAX_WAIT = 120000; // 120 seconds

async function loop() {
  counter = counter + 1;
  console.log("Checking if Hasura is up and migrations are ready....");
  try {
    const response = await fetch("http://localhost:8080/healthz");
    if (response.ok) {
      console.log("✅ Hasura is ready");
      return;
    }
  } catch (e) {
    console.error("Error verifying if Hasura is up...", e);
  }
  if (counter > MAX_WAIT / TIMEOUT) {
    throw new Error("Maximum wait time exceeded. Hasura was never ready.");
  }
  await new Promise((resolve) => setTimeout(resolve, TIMEOUT));
  loop();
}

loop();
