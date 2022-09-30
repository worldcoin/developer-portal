import { dev } from './dev'
import { production } from './production'
import { staging } from './staging'
import { ContextEnv } from 'common/types'

export const parameters = (params: {
  environment: ContextEnv
}): {
  databaseInstanceType: string
} => ({ production, staging, dev }[params.environment.stage]())
