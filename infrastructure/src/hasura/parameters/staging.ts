import * as cdk from 'aws-cdk-lib'
import scalingConfig from "./scaling-config.json"

export const staging = (params: { hostedZone: cdk.aws_route53.IHostedZone }) => ({
  envs: {
    HASURA_GRAPHQL_ENABLE_CONSOLE: 'true',
    HASURA_GRAPHQL_ENABLED_LOG_TYPES: 'startup, http-log, webhook-log, websocket-log, query-log',
    HASURA_GRAPHQL_UNAUTHORIZED_ROLE: 'public',
    SCALING_PARAMS: JSON.stringify(scalingConfig)
  },

  domainName: `api.${params.hostedZone.zoneName}`,
})
