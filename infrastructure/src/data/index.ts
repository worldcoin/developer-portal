import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";
import { MultiEnvRootStack } from "common/multi-env-stack";
import { Construct } from "constructs";
import { parameters } from "./parameters";

export class Data extends MultiEnvRootStack {
  public readonly databaseCluster: cdk.aws_rds.DatabaseCluster;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      readonly vpc: cdk.aws_ec2.IVpc;
    }
  ) {
    super(scope, id, props);
    cdk.Tags.of(this).add("service", "data");
    const stackParameters = parameters({
      environment: this.node.tryGetContext("env"),
    });

    const databaseSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      "DatabaseSecurityGroup",
      {
        allowAllOutbound: false,
        vpc: props.vpc,
      }
    );

    // CloudFormation does not support ServerLess cluster yet
    this.databaseCluster = new cdk.aws_rds.DatabaseCluster(this, "Database", {
      deletionProtection: true,
      iamAuthentication: true,
      storageEncrypted: true,
      defaultDatabaseName: "operatorapp",
      engine: cdk.aws_rds.DatabaseClusterEngine.auroraPostgres({
        version: cdk.aws_rds.AuroraPostgresEngineVersion.VER_13_6,
      }),
      parameters: {
        "rds.logical_replication": "1",
      },
      instances: 1,
      instanceProps: {
        instanceType: new cdk.aws_ec2.InstanceType(
          stackParameters.databaseInstanceType
        ),
        publiclyAccessible: true,
        securityGroups: [databaseSecurityGroup],
        vpc: props.vpc,
        vpcSubnets: { subnetGroupName: "Public" },
      },
      backup: {
        retention: cdk.Duration.days(7),
      },
    });

    // ANCHOR Allow conenctions from Retool
    // https://docs.retool.com/docs/connecting-your-database#connecting-your-database
    databaseSecurityGroup.connections.allowFrom(
      cdk.aws_ec2.Peer.ipv4("52.177.12.28/32"),
      cdk.aws_ec2.Port.tcp(this.databaseCluster.clusterEndpoint.port),
      "Allow from Retool to Database"
    );

    databaseSecurityGroup.connections.allowFrom(
      cdk.aws_ec2.Peer.ipv4("52.177.118.220/32"),
      cdk.aws_ec2.Port.tcp(this.databaseCluster.clusterEndpoint.port),
      "Allow from Retool to Database"
    );

    databaseSecurityGroup.connections.allowFrom(
      cdk.aws_ec2.Peer.ipv4("52.175.251.223/32"),
      cdk.aws_ec2.Port.tcp(this.databaseCluster.clusterEndpoint.port),
      "Allow from Retool to Database"
    );

    // ANCHOR Allow connections from Metabase
    // https://www.metabase.com/cloud/docs/ip-addresses-to-whitelist.html
    databaseSecurityGroup.connections.allowFrom(
      cdk.aws_ec2.Peer.ipv4("18.207.81.126/32"),
      cdk.aws_ec2.Port.tcp(this.databaseCluster.clusterEndpoint.port),
      "Allow from Metabase to Database"
    );

    databaseSecurityGroup.connections.allowFrom(
      cdk.aws_ec2.Peer.ipv4("3.211.20.157/32"),
      cdk.aws_ec2.Port.tcp(this.databaseCluster.clusterEndpoint.port),
      "Allow from Metabase to Database"
    );

    databaseSecurityGroup.connections.allowFrom(
      cdk.aws_ec2.Peer.ipv4("50.17.234.169/32"),
      cdk.aws_ec2.Port.tcp(this.databaseCluster.clusterEndpoint.port),
      "Allow from Metabase to Database"
    );

    // ANCHOR Exports
    this.exportValue(this.databaseCluster.secret!.secretArn, {
      name: `${this.stackName}:DatabaseClusterSecretArn`,
    });
    this.exportValue(databaseSecurityGroup.securityGroupId, {
      name: `${this.stackName}:DatabaseSecurityGroupId`,
    });

    // FIXME Use RDS IAM database authentication to obtain temporary credentials
    // https://github.com/worldcoin/distributors-web-app/pull/688
    NagSuppressions.addResourceSuppressions(
      this.databaseCluster,
      [
        {
          id: "AwsSolutions-SMG4",
          reason: "Requires integrating SecretsManager into Hasura.",
        },
      ],
      true
    );
  }
}
