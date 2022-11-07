import * as cdk from 'aws-cdk-lib'
import { ContextEnv } from 'common/types'

export const dev = (params: {
  environment: ContextEnv
  hostedZone: cdk.aws_route53.IHostedZone
}) => ({
  domainName: params.hostedZone.zoneName,
  envs: {
    SCALING_CONFIG: process.env.WEB_SCALING_CONFIG_JSON,
  },
})
