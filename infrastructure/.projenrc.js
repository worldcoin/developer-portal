const { awscdk } = require('projen')
const region = 'us-east-1'
const name = 'dev-portal'

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.25.0',
  appEntrypoint: 'index.ts',
  context: {
    '@aws-cdk/core:bootstrapQualifier': 'worldid',
    app: 'dev-portal',
    production: { dataDogApiKeySecretArn: 'arn:aws:secretsmanager:us-east-1:906266994114:secret:operator-app-datadog-DxKw2z', env: { account: '906266994114', id: 'production', stage: 'production', region } },
    staging: { dataDogApiKeySecretArn: 'arn:aws:secretsmanager:us-east-1:505538374473:secret:operator-app-datadog-Q7ihUi', env: { account: '505538374473', id: 'staging', stage: 'staging', region } },
    dev: { dataDogApiKeySecretArn: 'arn:aws:secretsmanager:us-east-1:926986201233:secret:operator-app-datadog-D35cyq', env: { account: '926986201233', stage: 'dev', region } }
  },
  defaultReleaseBranch: 'main',
  description: 'Utility projects for internal use.',
  deps: [
    'asserts@4.0.2', 'cdk-nag@2.12.47', 'ts-node@10.8.1',
  ],
  devDeps: ['tsconfig-paths@4.0.0'],
  github: false,
  license: '',
  name,
  packageName: `@worldcoin/${name}`,
  tsconfig: {
    compilerOptions: { paths: { '*': ['./src/*'] } },
  },
  eslint: false,
  yarn: false,
})

project.tsconfig.file.addOverride('ts-node', { require: ['tsconfig-paths/register'] })
project.gitignore.addPatterns(".env", ".env.local");
project.synth()
