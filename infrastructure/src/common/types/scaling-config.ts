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
    scaleOnCpuUtilization: {name: string; targetUtilizationPercent: number}
    scaleOnMemoryUtilization: {name: string; targetUtilizationPercent: number}
  }
}
