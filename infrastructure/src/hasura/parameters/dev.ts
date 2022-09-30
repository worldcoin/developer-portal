import * as cdk from 'aws-cdk-lib'
import { ContextEnv } from 'common/types'

export const dev = (params: { environment: ContextEnv; hostedZone: cdk.aws_route53.IHostedZone }) => ({
  envs: {
    HASURA_GRAPHQL_ENABLE_CONSOLE: 'true',
    HASURA_GRAPHQL_ENABLED_LOG_TYPES: 'startup, http-log, webhook-log, websocket-log, query-log',
    HASURA_GRAPHQL_UNAUTHORIZED_ROLE: 'public',
  },

  domainName: `api.${params.hostedZone.zoneName}`,
})
