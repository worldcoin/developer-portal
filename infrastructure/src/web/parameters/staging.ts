import * as cdk from "aws-cdk-lib";
import { ContextEnv } from "common/types";

export const staging = (params: {
  environment: ContextEnv;
  hostedZone: cdk.aws_route53.IHostedZone;
}) => ({
  domainName: params.hostedZone.zoneName,
  envs: {
    NEXT_PUBLIC_APP_URL: "https://staging.developer.worldcoin.org",
  },
});
