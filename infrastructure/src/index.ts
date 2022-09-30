#! ts-node -r tsconfig-paths/register
import * as cdk from 'aws-cdk-lib'
import assert from 'assert'
import { AwsSolutionsChecks } from 'cdk-nag'
import { Core } from './core'
import { Data } from './data'
import { Hasura } from './hasura'
import { Web } from './web'

export class App extends cdk.App {
  constructor(props?: cdk.AppProps) {
    super(props)
    cdk.Tags.of(this).add('app', this.node.tryGetContext('app'))

    // Run best practices and shallow security checks
    if (!this.node.tryGetContext('isCDKNagDisabled')) {
      cdk.Aspects.of(this).add(new AwsSolutionsChecks())
    }

    // ANCHOR Construct the context
    const envId = this.node.tryGetContext('env:id')
    const stageName = this.node.tryGetContext('stage') || 'dev'
    const stageContext = this.node.tryGetContext(stageName)
    assert(stageName !== 'dev' || envId, 'Dev stacks must always be prefixed, pass "--context env:id=<your env name>"')

    // Set env id to the developer unique id in case of dev stage
    stageContext.env.id = envId || stageContext.env.id

    // Unfold the context from stage named properties to the top of the context object
    Object.entries(stageContext).forEach(([key, value]) => this.node.setContext(key, value))

    // ANCHOR Define the stacks
    const webStackId = 'web'
    const core = new Core(this, 'core', { env: stageContext.env, terminationProtection: true })
    const data = new Data(this, 'data', { env: stageContext.env, vpc: core.vpc, terminationProtection: true })

    const hasura = new Hasura(this, 'hasura', {
      cloudMapNamespace: core.cloudMapNamespace,
      dataDogApiKeySecret: core.dataDogApiKeySecret,
      env: stageContext.env,
      hostedZone: core.hostedZone,
      databaseCluster: data.databaseCluster,
      databaseClusterSecret: data.databaseCluster.secret!,
      internalEndpointSecret: core.internalEndpointSecret,
      secretsSecret: core.secretsSecret,
      vpc: core.vpc,
      webUrl: `http://${webStackId}.${core.cloudMapNamespace.namespaceName}:${Web.port}`,
    })

    new Web(this, webStackId, {
      cloudMapNamespace: core.cloudMapNamespace,
      dataDogApiKeySecret: core.dataDogApiKeySecret,
      internalEndpointSecret: core.internalEndpointSecret,
      env: stageContext.env,
      secretsSecret: core.secretsSecret,
      vpc: core.vpc,
      hostedZone: core.hostedZone,
      graphQlApiUrl: hasura.toServicePublicUrl(),
      containerImageTag: this.node.tryGetContext('webContainerImageTag'),
    })
  }
}

// Without "treeMetadata: false" setContext() call within the App is not allowed
const app = new App({ treeMetadata: false })
app.synth()
