export type ScalingConfig = {
  taskDefinition: {cpu: number; memoryLimitMiB: number}

  healthCheck: {
    healthyThresholdCount: number
    interval: number
    path: string
    timeout: number
  };

  autoscaling: {
    autoScaleTaskCount: {minCapacity: number; maxCapacity: number}
    scaleOnCpuUtilization: {targetUtilizationPercent: number}
    scaleOnMemoryUtilization: {targetUtilizationPercent: number}
  }
}
