import * as cdk from 'aws-cdk-lib'
import { dev } from './dev'
import { production } from './production'
import { staging } from './staging'
import { ContextEnv } from 'common/types'

export const parameters = (params: {
  environment: ContextEnv
  hostedZone: cdk.aws_route53.IHostedZone
}): {
  domainName: string
  envs: Record<string, string>
} => ({ dev, production, staging }[params.environment.stage](params))
