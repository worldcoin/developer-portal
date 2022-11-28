import * as cdk from 'aws-cdk-lib'
import * as path from 'path'
import { Construct } from 'constructs'
import { DataDog } from 'common/datadog'
import { parameters } from './parameters'
import { NagSuppressions } from 'cdk-nag'
import { MultiEnvRootStack } from 'common/multi-env-stack'
import { ScalingConfig } from 'common/types'

export class Web extends MultiEnvRootStack {
  public static readonly port = 3000
  public readonly fargateService: cdk.aws_ecs_patterns.ApplicationLoadBalancedFargateService
  public readonly scalableTarget: cdk.aws_ecs.ScalableTaskCount

  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      readonly cloudMapNamespace: cdk.aws_servicediscovery.IPrivateDnsNamespace
      readonly dataDogApiKeySecret: cdk.aws_secretsmanager.ISecret
      readonly internalEndpointSecret: cdk.aws_secretsmanager.ISecret
      readonly vpc: cdk.aws_ec2.IVpc
      readonly hostedZone: cdk.aws_route53.IHostedZone
      readonly secretsSecret: cdk.aws_secretsmanager.ISecret
      readonly graphQlApiUrl: string
      readonly containerImageTag: string
    }
  ) {
    super(scope, id, props)
    cdk.Tags.of(this).add('service', id)
    const stackParameters = parameters({
      environment: this.node.tryGetContext('env'),
      hostedZone: props.hostedZone,
    })

    const scalingConfig = stackParameters.envs.SCALING_CONFIG
      ? (JSON.parse(stackParameters.envs.SCALING_CONFIG) as ScalingConfig)
      : null

    if (!scalingConfig) {
      console.error('Scaling config is not defined')
    }

    // ANCHOR Certificate
    const certificate = new cdk.aws_certificatemanager.Certificate(
      this,
      'Certificate',
      {
        domainName: stackParameters.domainName,
        validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(
          props.hostedZone
        ),
      }
    )

    // ANCHOR Load balancer and Fargate service
    const ecsCluster = new cdk.aws_ecs.Cluster(this, 'Cluster', {
      containerInsights: true,
      vpc: props.vpc,
    })

    this.fargateService =
      new cdk.aws_ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        'FargateService',
        {
          domainName: stackParameters.domainName,
          domainZone: props.hostedZone,
          certificate: certificate,
          circuitBreaker: { rollback: true },
          cloudMapOptions: {
            cloudMapNamespace: props.cloudMapNamespace,
            name: id,
          },
          cluster: ecsCluster,
          memoryLimitMiB: scalingConfig?.taskDefinition.memoryLimitMiB || 1024,
          desiredCount: 3,
          cpu: scalingConfig?.taskDefinition.cpu || 512,
          redirectHTTP: true,

          taskImageOptions: {
            containerPort: Web.port,
            environment: {
              ...stackParameters.envs,
              NEXT_PUBLIC_GRAPHQL_API_URL: props.graphQlApiUrl,
              TWILIO_VERIFY_SERVICE: 'VAe3ef1fb47793216069edadea3cc094c9',
            },
            secrets: {
              ALCHEMY_API_KEY: cdk.aws_ecs.Secret.fromSecretsManager(
                props.secretsSecret,
                'ALCHEMY_API_KEY'
              ),
              HASURA_GRAPHQL_JWT_SECRET: cdk.aws_ecs.Secret.fromSecretsManager(
                props.secretsSecret,
                'HASURA_GRAPHQL_JWT_SECRET'
              ),
              INTERNAL_ENDPOINTS_SECRET: cdk.aws_ecs.Secret.fromSecretsManager(
                props.internalEndpointSecret
              ),
              CONSUMER_BACKEND_JWT: cdk.aws_ecs.Secret.fromSecretsManager(
                props.secretsSecret,
                'CONSUMER_BACKEND_JWT'
              ),
              CONSUMER_BACKEND_JWT_STAGING:
                cdk.aws_ecs.Secret.fromSecretsManager(
                  props.secretsSecret,
                  'CONSUMER_BACKEND_JWT_STAGING'
                ),
              TWILIO_ACCOUNT_SID: cdk.aws_ecs.Secret.fromSecretsManager(
                props.secretsSecret,
                'TWILIO_ACCOUNT_SID'
              ),
              TWILIO_AUTH_TOKEN: cdk.aws_ecs.Secret.fromSecretsManager(
                props.secretsSecret,
                'TWILIO_AUTH_TOKEN'
              ),
              PHONE_NULLIFIER_SALT: cdk.aws_ecs.Secret.fromSecretsManager(
                props.secretsSecret,
                'PHONE_NULLIFIER_SALT'
              ),
              PHONE_NULLIFIER_SIGNING_KEY:
                cdk.aws_ecs.Secret.fromSecretsManager(
                  props.secretsSecret,
                  'PHONE_NULLIFIER_SIGNING_KEY'
                ),
            },
            logDriver: cdk.aws_ecs.LogDrivers.firelens({
              options: {
                Name: 'datadog',
                Host: 'http-intake.logs.datadoghq.com',
                dd_service: id,
                dd_source: 'nodejs',
                dd_tags: `app:${this.node.tryGetContext('app')}, env:${
                  this.node.tryGetContext('env').id
                }`,
                TLS: 'on',
                provider: 'ecs',
              },

              secretOptions: {
                apikey: cdk.aws_ecs.Secret.fromSecretsManager(
                  props.dataDogApiKeySecret
                ),
              },
            }),

            image: cdk.aws_ecs.ContainerImage.fromAsset(
              path.dirname(require.resolve('../../../web/Dockerfile'))
            ),
          },
        }
      )

    this.fargateService.targetGroup.setAttribute(
      'deregistration_delay.timeout_seconds',
      '10'
    )
    this.fargateService.service.connections.allowFromAnyIpv4(
      cdk.aws_ec2.Port.tcp(Web.port)
    )

    // ANCHOR Health check
    this.fargateService.targetGroup.configureHealthCheck({
      enabled: true,
      healthyThresholdCount:
        scalingConfig?.healthCheck.healthyThresholdCount ?? 2,
      interval: cdk.Duration.seconds(scalingConfig?.healthCheck.interval ?? 5),
      path: scalingConfig?.healthCheck.path ?? '/api/health',
      timeout: cdk.Duration.seconds(scalingConfig?.healthCheck.timeout ?? 2),
    })

    // ANCHOR Autoscaling
    this.scalableTarget = this.fargateService.service.autoScaleTaskCount({
      minCapacity:
        scalingConfig?.autoscaling.autoScaleTaskCount.minCapacity ?? 1,
      maxCapacity:
        scalingConfig?.autoscaling.autoScaleTaskCount.maxCapacity ?? 30,
    })

    this.scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent:
        scalingConfig?.autoscaling.scaleOnCpuUtilization
          .targetUtilizationPercent ?? 40,
    })

    this.scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent:
        scalingConfig?.autoscaling.scaleOnMemoryUtilization
          .targetUtilizationPercent ?? 50,
    })

    // ANCHOR Set up logging
    new DataDog(this, 'DataDog', {
      dataDogApiKeySecret: props.dataDogApiKeySecret,
      taskDefinition: this.fargateService.taskDefinition,
    })

    const logsBucket = new cdk.aws_s3.Bucket(this, 'LogsBucket', {
      encryption: cdk.aws_s3.BucketEncryption.KMS_MANAGED,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    })

    this.fargateService.loadBalancer.logAccessLogs(logsBucket)

    NagSuppressions.addResourceSuppressions(logsBucket, [
      {
        id: 'AwsSolutions-S1',
        reason: 'Breaking logs bucket needs to store access logs recursion.',
      },
    ])

    NagSuppressions.addResourceSuppressions(
      this.fargateService.loadBalancer,
      [{ id: 'AwsSolutions-EC23', reason: 'Public ELB' }],
      true
    )

    NagSuppressions.addResourceSuppressions(
      this.fargateService.service,
      [{ id: 'AwsSolutions-EC23', reason: 'Public service' }],
      true
    )

    NagSuppressions.addResourceSuppressions(
      this.fargateService.taskDefinition,
      [
        {
          id: 'AwsSolutions-ECS2',
          reason: 'Avoiding env variables is to much hassle.',
        },
        {
          appliesTo: ['Resource::*'],
          id: 'AwsSolutions-IAM5',
          reason:
            'ecr:GrantAuthorizationToken can not be applied to a certain resource and thus is applied to [Resource::*].',
        },
      ],
      true
    )
  }
}
