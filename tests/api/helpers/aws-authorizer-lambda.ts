import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

export const authHelper = async () => {
  // Log AWS environment variables
  console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
  console.log(
    "AWS_SECRET_ACCESS_KEY:",
    process.env.AWS_SECRET_ACCESS_KEY ? "***SET***" : "NOT SET",
  );
  console.log(
    "AWS_SESSION_TOKEN:",
    process.env.AWS_SESSION_TOKEN ? "***SET***" : "NOT SET",
  );
  console.log("AWS_REGION:", process.env.AWS_REGION);

  // Alternative: Explicitly use environment variables
  const client = new LambdaClient({
    region: "eu-west-1",
  });

  // Lambda ARN and event
  const lambdaArn =
    // eslint-disable-next-line @cspell/spellchecker -- arn
    "arn:aws:lambda:eu-west-1:505538374473:function:developer-portal-pipeline-JwtIssuerJwtIssuerLambda-yRWHJkKzbtt6";

  // Working event format
  const event = {
    role: "qa",
    // userId: "test_user_123"
  };

  console.log("Using event format:", JSON.stringify(event, null, 2));

  // Prepare the command
  const command = new InvokeCommand({
    FunctionName: lambdaArn,
    Payload: Buffer.from(JSON.stringify(event)),
  });

  try {
    const response = await client.send(command);
    const payload = response.Payload
      ? Buffer.from(response.Payload).toString()
      : null;
    console.log("Lambda response:", payload);

    if (payload) {
      const parsedResponse = JSON.parse(payload);
      if (parsedResponse.statusCode === 200 && parsedResponse.body) {
        const body = JSON.parse(parsedResponse.body);
        return body.token;
      }
    }

    return null;
  } catch (err) {
    console.error("Error invoking Lambda:", err);
    process.exit(1);
  }
};
