import { dev } from './dev'
import { production } from './production'
import { staging } from './staging'
import { ContextEnv } from 'common/types'

export const parameters = (params: {
  environment: ContextEnv
}): {
  cloudMapNamespace: string
  hostedZoneName: string
  secretsBundleArn: string
} => ({ production, staging, dev: dev({ envId: params.environment.id }) }[params.environment.stage])
