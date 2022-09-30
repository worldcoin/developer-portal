export const dev = (params: { envId: string }) => ({
  cloudMapNamespace: `${params.envId}-dev-portal`,
  hostedZoneName: `${params.envId}.dev-portal.wldwld.com`,
  secretsBundleArn: 'arn:aws:secretsmanager:us-east-1:926986201233:secret:DevPortalSecretsBundle-WPjnu6',
})
