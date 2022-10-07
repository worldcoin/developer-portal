import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { DataDog } from 'common/datadog'
import { parameters } from './parameters'
import { NagSuppressions } from 'cdk-nag'
import { MultiEnvRootStack } from 'common/multi-env-stack'
import { ScalingConfig } from 'common/types'

export class Hasura extends MultiEnvRootStack {
  public static readonly port = 8080
  public readonly cloudMapNamespace: cdk.aws_servicediscovery.IPrivateDnsNamespace
  public readonly service: cdk.aws_ecs.FargateService
  public readonly serviceUrl: string
  public readonly domainName: string

  constructor(
    scope: Construct,
    id: string,
    props: {
      readonly cloudMapNamespace: cdk.aws_servicediscovery.IPrivateDnsNamespace
      readonly dataDogApiKeySecret: cdk.aws_secretsmanager.ISecret
      readonly hostedZone: cdk.aws_route53.IHostedZone
      readonly databaseCluster: cdk.aws_rds.IDatabaseCluster
      readonly databaseClusterSecret: cdk.aws_secretsmanager.ISecret
      readonly internalEndpointSecret: cdk.aws_secretsmanager.ISecret
      readonly secretsSecret: cdk.aws_secretsmanager.ISecret
      readonly vpc: cdk.aws_ec2.IVpc
      readonly webUrl: string
    } & cdk.StackProps,
  ) {
    super(scope, id, props)
    const stackParameters = parameters({ environment: this.node.tryGetContext('env'), hostedZone: props.hostedZone })
    const ecsCluster = new cdk.aws_ecs.Cluster(this, 'Cluster', { containerInsights: true, vpc: props.vpc })
    this.cloudMapNamespace = props.cloudMapNamespace
    this.domainName = stackParameters.domainName

    const scalingConfig = stackParameters.envs.SCALING_CONFIG
      ? (JSON.parse(stackParameters.envs.SCALING_CONFIG) as ScalingConfig)
      : null;

    if (!scalingConfig) {
      console.error("Scaling config is not defined")
    }

    // ANCHOR Secrets
    const adminSecret = new cdk.aws_secretsmanager.Secret(this, 'admin-secret', {
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 16,
        generateStringKey: 'password',
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
      },
    })

    // ANCHOR Task definition
    // Define the task as FargateTaskDefinition, because taskImageOptions does not have the command param
    const taskDefinition = new cdk.aws_ecs.FargateTaskDefinition(this, 'task-definition', {
      cpu: scalingConfig?.taskDefinition.cpu || 512,
      memoryLimitMiB: scalingConfig?.taskDefinition.memoryLimitMiB || 1024,
    })

    taskDefinition.addContainer('Hasura', {
      containerName: id,
      image: cdk.aws_ecs.ContainerImage.fromRegistry('hasura/graphql-engine:v2.7.0'),
      command: [
        '/bin/sh',
        '-c',
        'HASURA_GRAPHQL_DATABASE_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DATABASE" graphql-engine serve',
      ],
      environment: {
        ...stackParameters.envs,
        NEXT_API_URL: `${props.webUrl}/api`,
      },
      secrets: {
        HASURA_GRAPHQL_ADMIN_SECRET: cdk.aws_ecs.Secret.fromSecretsManager(adminSecret, 'password'),
        HASURA_GRAPHQL_JWT_SECRET: cdk.aws_ecs.Secret.fromSecretsManager(props.secretsSecret, 'HASURA_GRAPHQL_JWT_SECRET'),
        POSTGRES_USER: cdk.aws_ecs.Secret.fromSecretsManager(props.databaseClusterSecret, 'username'),
        POSTGRES_PASSWORD: cdk.aws_ecs.Secret.fromSecretsManager(props.databaseClusterSecret, 'password'),
        POSTGRES_HOST: cdk.aws_ecs.Secret.fromSecretsManager(props.databaseClusterSecret, 'host'),
        POSTGRES_PORT: cdk.aws_ecs.Secret.fromSecretsManager(props.databaseClusterSecret, 'port'),
        POSTGRES_DATABASE: cdk.aws_ecs.Secret.fromSecretsManager(props.databaseClusterSecret, 'dbname'),
        INTERNAL_ENDPOINTS_SECRET: cdk.aws_ecs.Secret.fromSecretsManager(props.internalEndpointSecret),
      },
      logging: cdk.aws_ecs.LogDrivers.firelens({
        options: {
          Name: 'datadog',
          Host: 'http-intake.logs.datadoghq.com',
          dd_service: id,
          dd_source: 'nodejs',
          dd_tags: `app:${this.node.tryGetContext('app')}, env:${this.node.tryGetContext('env').id}`,
          TLS: 'on',
          provider: 'ecs',
        },
        secretOptions: { apikey: cdk.aws_ecs.Secret.fromSecretsManager(props.dataDogApiKeySecret) },
      }),
      portMappings: [{ containerPort: Hasura.port }],
    })

    // ANCHOR Set up Fargate service
    const fargateServicePattern = new cdk.aws_ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'FargateService',
      {
        cloudMapOptions: { name: id, cloudMapNamespace: props.cloudMapNamespace },
        domainName: stackParameters.domainName,
        domainZone: props.hostedZone,
        protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS,
        redirectHTTP: true,
        circuitBreaker: { rollback: true },
        cluster: ecsCluster,
        openListener: true,
        desiredCount: 3,
        taskDefinition,
        taskSubnets: { subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_NAT },
      },
    )

    fargateServicePattern.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '10')

    fargateServicePattern.service.connections.allowTo(
      props.databaseCluster,
      cdk.aws_ec2.Port.tcp(props.databaseCluster.clusterEndpoint.port),
      'Allow from Hasura to Database',
    )

    // ANCHOR Health check
    fargateServicePattern.targetGroup.configureHealthCheck({
      enabled: true,
      healthyThresholdCount: scalingConfig?.healthCheck.healthyThresholdCount ?? 2,
      interval: cdk.Duration.seconds(scalingConfig?.healthCheck.interval ?? 5),
      path: scalingConfig?.healthCheck.path ?? '/health',
      timeout: cdk.Duration.seconds(scalingConfig?.healthCheck.timeout ?? 2),
    })

    // ANCHOR Autoscaling
    const scalableTarget = fargateServicePattern.service.autoScaleTaskCount({
      minCapacity: scalingConfig?.autoscaling.autoScaleTaskCount.minCapacity ?? 1,
      maxCapacity: scalingConfig?.autoscaling.autoScaleTaskCount.maxCapacity ?? 30
    })

    scalableTarget.scaleOnCpuUtilization(
      'CpuScaling',
      { targetUtilizationPercent: scalingConfig?.autoscaling.scaleOnCpuUtilization.targetUtilizationPercent ?? 40 }
    )

    scalableTarget.scaleOnMemoryUtilization(
      'MemoryScaling',
      { targetUtilizationPercent: scalingConfig?.autoscaling.scaleOnMemoryUtilization.targetUtilizationPercent ?? 50 }
    )

    // ANCHOR Set up logging
    new DataDog(this, 'DataDog', {
      dataDogApiKeySecret: props.dataDogApiKeySecret,
      taskDefinition: fargateServicePattern.taskDefinition,
    })

    const logsBucket = new cdk.aws_s3.Bucket(this, 'LogsBucket', {
      encryption: cdk.aws_s3.BucketEncryption.KMS_MANAGED,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    })

    fargateServicePattern.loadBalancer.logAccessLogs(logsBucket)

    const serviceUrlOutput = fargateServicePattern.node.findChild('ServiceURL') as cdk.CfnOutput
    this.service = fargateServicePattern.service
    this.serviceUrl = `${serviceUrlOutput.value}/v1/graphql`

    NagSuppressions.addResourceSuppressions(logsBucket, [
      { id: 'AwsSolutions-S1', reason: 'Breaking logs bucket needs to store access logs recursion.' },
    ])

    NagSuppressions.addResourceSuppressions(
      fargateServicePattern,
      [{ id: 'AwsSolutions-EC23', reason: 'Public ELB.' }],
      true,
    )

    NagSuppressions.addResourceSuppressions(fargateServicePattern.taskDefinition, [
      { id: 'AwsSolutions-ECS2', reason: 'Avoiding env variables is to much hassle.' },
    ])

    NagSuppressions.addResourceSuppressions(adminSecret, [
      { id: 'AwsSolutions-SMG4', reason: 'Requires a dedicated planning.' },
    ])
  }

  public toServicePublicUrl(): string {
    return `https://${this.domainName}/v1/graphql`
  }
}
