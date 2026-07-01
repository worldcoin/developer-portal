"use client";

import {
  CategoryScale,
  ChartData,
  ChartDataset,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  ScriptableContext,
  Title,
  Tooltip,
} from "chart.js";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";

export type ChartProps = {
  data: { y: Array<ChartDataset<"line">>; x: string[] };
  options?: ChartOptions<"line">;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type UnknownRecord = Record<string, unknown>;

const isMergeableObject = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Deep-merge plain objects (later values win; arrays and primitives are replaced).
const deepMerge = (
  target: UnknownRecord,
  source: UnknownRecord,
): UnknownRecord => {
  const output: UnknownRecord = { ...target };
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = output[key];
    output[key] =
      isMergeableObject(targetValue) && isMergeableObject(sourceValue)
        ? deepMerge(targetValue, sourceValue)
        : sourceValue;
  }
  return output;
};

const defaultOptions: ChartOptions<"line"> = {
  responsive: true,

  aspectRatio: 1180 / 350,

  plugins: {
    legend: {
      display: false,
    },

    tooltip: {
      backgroundColor: "#ffffff",
      bodyColor: "#858494",

      callbacks: {
        title: () => "",
        labelColor: (context) => ({
          borderWidth: 0,
          borderRadius: 2,
          borderColor: "transparent",
          backgroundColor: context.dataset.borderColor as string,
        }),
      },

      displayColors: true,
      borderColor: "#EBECEF",
      borderWidth: 1,
    },
  },

  layout: {
    // NOTE: top and right paddings can be only increased
    padding: { left: -24, bottom: -24 },
  },

  scales: {
    x: {
      offset: false,
      display: true,

      border: {
        display: false,
      },

      grid: {
        lineWidth: 0,
      },

      ticks: {
        padding: 24,
        color: "#9BA3AE",
      },
    },

    y: {
      display: true,

      border: {
        display: false,
        dash: [5, 5],
      },

      ticks: {
        padding: 24,
        color: "#9BA3AE",
        font: {
          family: "GT America",
          size: 12,
        },
        precision: 0,
        maxTicksLimit: 5,
      },
    },
  },
};

export const Chart = (props: ChartProps) => {
  const data: ChartData<"line"> = useMemo(
    () => ({
      labels: props.data.x,
      datasets: props.data.y.map((dataset) => ({
        pointRadius: dataset.data.length === 1 ? 5 : dataset.pointRadius,
        pointHoverRadius:
          dataset.data.length === 1 ? 5 : dataset.pointHoverRadius,
        fill: true,
        backgroundColor: (context: ScriptableContext<"line">) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(
            ctx.canvas.clientWidth / 2,
            0,
            ctx.canvas.clientWidth / 2,
            ctx.canvas.clientHeight,
          );
          gradient.addColorStop(0, "rgba(73, 64, 224, 0.06)");
          gradient.addColorStop(1, "rgba(251, 251, 252, 0)");
          return gradient;
        },
        ...dataset,
      })),
    }),
    [props.data.x, props.data.y],
  );

  const options = useMemo(() => {
    if (!props.options) {
      return defaultOptions;
    }

    return deepMerge(
      defaultOptions as UnknownRecord,
      props.options as UnknownRecord,
    ) as ChartOptions<"line">;
  }, [props.options]);

  return <Line options={options} data={data} />;
};
