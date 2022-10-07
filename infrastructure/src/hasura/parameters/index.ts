import * as cdk from 'aws-cdk-lib'
import { dev } from './dev'
import { production } from './production'
import { staging } from './staging'
import { ContextEnv } from 'common/types'

type UndefinedKeys<T> = {
  [P in keyof T]: undefined extends T[P] ? P : never;
}[keyof T]

// @ANCHOR Makes the key optional if the value of this key has undefined type in the declaration
type OptionalUndefined<T> = Partial<Pick<T, UndefinedKeys<T>>> &
  Omit<T, UndefinedKeys<T>>

type Envs = OptionalUndefined<ReturnType<typeof staging>['envs']> &
  OptionalUndefined<ReturnType<typeof dev>['envs']> &
  OptionalUndefined<ReturnType<typeof production>['envs']>

export const parameters = (params: {
  environment: ContextEnv
  hostedZone: cdk.aws_route53.IHostedZone
}): {
  domainName: string
  envs: Envs
} => ({ dev, production, staging }[params.environment.stage](params))
