import * as cdk from 'aws-cdk-lib'
import { dev } from './dev'
import { production } from './production'
import { staging } from './staging'
import { ContextEnv } from 'common/types'

type Envs = Partial<ReturnType<typeof staging>['envs']> &
  Partial<ReturnType<typeof dev>['envs']> &
  Partial<ReturnType<typeof production>['envs']>

export const parameters = (params: {
  environment: ContextEnv
  hostedZone: cdk.aws_route53.IHostedZone
}): {
  domainName: string
  envs: Envs
} => ({ dev, production, staging }[params.environment.stage](params))
