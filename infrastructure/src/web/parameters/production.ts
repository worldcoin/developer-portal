import * as cdk from 'aws-cdk-lib'
import { ContextEnv } from 'common/types'

export const production = (params: {
  environment: ContextEnv
  hostedZone: cdk.aws_route53.IHostedZone
}) => ({
  domainName: params.hostedZone.zoneName,
  envs: {
    NEXT_PUBLIC_IRONCLAD_ACCESS_ID: 'c9d85b2e-8b65-4f1f-8308-4fb888534976',
    NEXT_PUBLIC_IRONCLAD_GROUP_KEY: 'group-sk1enjwk9',
    NEXT_PUBLIC_POSTHOG_API_KEY:
      'phc_QttqgDbMQDYHX1EMH7FnT6ECBVzdp0kGUq92aQaVQ6I',
    NEXT_PUBLIC_APP_URL: 'https://legacy.developer.worldcoin.org',
    SCALING_CONFIG: process.env.WEB_SCALING_CONFIG_JSON,
  },
})
