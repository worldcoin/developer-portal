"use client";

import { useEffect, useRef } from "react";

const WORLD_LOGO_PATH =
  "M10 18.333q-2.26 0-4.176-1.122a8.3 8.3 0 0 1-3.036-3.036A8.1 8.1 0 0 1 1.667 10q0-2.26 1.121-4.176a8.3 8.3 0 0 1 3.036-3.035A8.1 8.1 0 0 1 10 1.666q2.26 0 4.176 1.122a8.35 8.35 0 0 1 3.036 3.035A8.13 8.13 0 0 1 18.333 10q0 2.261-1.121 4.176a8.3 8.3 0 0 1-3.036 3.036A8.13 8.13 0 0 1 10 18.333m-7.629-7.467V9.167h15.274v1.7zM10 16.597a6.3 6.3 0 0 0 3.281-.885 6.5 6.5 0 0 0 2.36-2.394q.867-1.509.866-3.316 0-1.807-.867-3.317a6.5 6.5 0 0 0-2.359-2.393A6.3 6.3 0 0 0 10 3.406a6.3 6.3 0 0 0-3.281.886 6.53 6.53 0 0 0-2.36 2.393q-.867 1.51-.866 3.317t.866 3.316a6.5 6.5 0 0 0 2.36 2.394q1.491.885 3.281.885m-4.447-6.473v-.217q0-1.283.614-2.322a4.35 4.35 0 0 1 1.726-1.636q1.113-.597 2.54-.596h5.585l.795 1.664h-6.308q-1.41 0-2.269.813-.859.814-.86 2.079v.218q.001 1.284.86 2.088.858.803 2.27.804h6.307l-.795 1.664h-5.585q-1.428-.001-2.54-.596a4.35 4.35 0 0 1-1.726-1.636q-.614-1.04-.614-2.322z";

type Cell = {
  column: number;
  index: number;
  logoAlpha: number;
  row: number;
  seed: number;
  size: number;
  x: number;
  y: number;
};

type Grid = {
  columns: number;
  gap: number;
  offsetX: number;
  offsetY: number;
  rows: number;
  size: number;
  step: number;
};

type Wave = {
  coverage: number;
  index: number;
  salt: number;
  x: number;
  y: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const BasePixelStrip = () => {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!root || !canvas || !context) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const logoPath =
      typeof Path2D === "undefined" ? null : new Path2D(WORLD_LOGO_PATH);
    const maskCanvas = document.createElement("canvas");
    const maskContext = maskCanvas.getContext("2d");

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let cells: Cell[] = [];
    let grid: Grid = {
      columns: 0,
      gap: 4,
      offsetX: 0,
      offsetY: 0,
      rows: 0,
      size: 8,
      step: 12,
    };
    let logoLayout = { left: 0, size: 1, top: 0 };
    let wave: Wave = {
      coverage: 0.4,
      index: -1,
      salt: 0,
      x: 0.5,
      y: 0.5,
    };

    const random = (index: number, salt = 0) => {
      const value = Math.sin(index * 947.173 + salt * 117.31) * 10000;
      return value - Math.floor(value);
    };

    const colorForCell = (cell: Cell, lift: number, flash: number) => {
      const xMix = clamp((cell.x - logoLayout.left) / logoLayout.size, 0, 1);
      const yMix = clamp((cell.y - logoLayout.top) / logoLayout.size, 0, 1);
      const green = Math.round(
        136 - xMix * 58 + lift * 36 - flash * 88 - yMix * 14,
      );
      const blue = Math.round(206 + lift * 28 + flash * 42);

      return (
        "rgb(0, " + clamp(green, 22, 172) + ", " + clamp(blue, 202, 255) + ")"
      );
    };

    const rebuildLogoMask = (): Uint8ClampedArray | null => {
      if (!logoPath || !maskContext) {
        return null;
      }

      maskCanvas.width = width;
      maskCanvas.height = height;
      maskContext.clearRect(0, 0, width, height);

      const size = Math.min(width, height) * 0.92;

      logoLayout = {
        left: width / 2 - size / 2,
        size,
        top: height / 2 - size / 2,
      };

      maskContext.save();
      maskContext.translate(logoLayout.left, logoLayout.top);
      maskContext.scale(logoLayout.size / 20, logoLayout.size / 20);
      maskContext.fillStyle = "#000000";
      maskContext.fill(logoPath);
      maskContext.restore();

      return maskContext.getImageData(0, 0, width, height).data;
    };

    const rebuildGrid = () => {
      cells = [];
      const logoMask = rebuildLogoMask();

      const size = width < 640 ? 7 : 8;
      const gap = width < 640 ? 3 : 4;
      const step = size + gap;
      const columns = Math.ceil(width / step) + 2;
      const rows = Math.ceil(height / step) + 2;
      const offsetX = (width - (columns - 1) * step - size) / 2;
      const offsetY = (height - (rows - 1) * step - size) / 2;

      grid = {
        columns,
        gap,
        offsetX,
        offsetY,
        rows,
        size,
        step,
      };

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column;
          const x = offsetX + column * step;
          const y = offsetY + row * step;
          const sampleX = clamp(Math.round(x + size / 2), 0, width - 1);
          const sampleY = clamp(Math.round(y + size / 2), 0, height - 1);
          const logoAlpha = logoMask
            ? logoMask[(sampleY * width + sampleX) * 4 + 3] / 255
            : 0;

          cells.push({
            column,
            index,
            logoAlpha,
            row,
            seed: random(index),
            size,
            x,
            y,
          });
        }
      }
    };

    const updateWave = (seconds: number) => {
      const index = reduceMotion ? 0 : Math.floor(seconds);

      if (wave.index === index) {
        return;
      }

      wave = {
        coverage: 0.34 + random(index + 29, 7) * 0.24,
        index,
        salt: index + 1000,
        x: 0.08 + random(index + 31, 17) * 0.84,
        y: 0.2 + random(index + 37, 23) * 0.6,
      };
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      rebuildGrid();
    };

    const draw = (time = 0) => {
      context.clearRect(0, 0, width, height);

      const seconds = time / 1000;
      const progress = reduceMotion ? 0.5 : seconds - Math.floor(seconds);
      const pulse = reduceMotion
        ? 0.65
        : progress < 0.08
          ? progress / 0.08
          : progress < 0.36
            ? 1
            : clamp(1 - (progress - 0.36) / 0.16, 0, 1);
      updateWave(seconds);

      const spotlightX = wave.x * width;
      const spotlightY = wave.y * height;
      const radius = Math.max(96, Math.min(width * 0.22, 220));

      cells.forEach((cell) => {
        const centerX = cell.x + cell.size / 2;
        const centerY = cell.y + cell.size / 2;
        const logoAlpha = cell.logoAlpha;

        if (logoAlpha >= 0.08) {
          const dx = centerX - spotlightX;
          const dy = centerY - spotlightY;
          const spotlight = clamp(1 - Math.hypot(dx, dy) / radius, 0, 1);
          const isActive = random(cell.index, wave.salt) < wave.coverage;
          const flicker = reduceMotion
            ? 1
            : 0.78 +
              Math.sin(seconds * 45 + cell.seed * 22) * 0.24 +
              random(cell.index, wave.salt + 3) * 0.3;
          const texture = random(cell.index, 43) < 0.04 ? 0.55 : 1;
          const flash = isActive
            ? pulse * flicker * (0.72 + spotlight * 1.4)
            : 0;
          const intensity = clamp(logoAlpha * texture * (0.48 + flash), 0, 1);

          if (intensity >= 0.04) {
            context.globalAlpha = intensity;
            context.fillStyle = colorForCell(cell, spotlight, flash);
            context.fillRect(cell.x, cell.y, cell.size, cell.size);

            const glow = clamp(flash, 0, 1);

            context.globalAlpha = intensity * (0.144 + glow * 0.396);
            context.fillStyle = "#9bf6ff";
            context.fillRect(
              cell.x + 1,
              cell.y + 1,
              cell.size - 2,
              cell.size - 2,
            );

            if (glow > 0.5) {
              context.globalAlpha = intensity * (glow - 0.5) * 1.44;
              context.fillStyle = "#ffffff";
              context.fillRect(
                cell.x + 2,
                cell.y + 2,
                cell.size - 4,
                cell.size - 4,
              );
            }
          }
        }
      });

      context.globalAlpha = 1;

      if (!reduceMotion) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(resize);
      observer.observe(root);
    } else {
      window.addEventListener("resize", resize);
    }

    resize();
    draw();

    return () => {
      window.cancelAnimationFrame(frame);

      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener("resize", resize);
      }
    };
  }, []);

  return (
    <section
      aria-label="Interactive pixel field"
      className="absolute inset-0 overflow-hidden bg-white"
      ref={rootRef}
      suppressHydrationWarning
    >
      <canvas
        aria-hidden="true"
        className="absolute inset-0 size-full"
        ref={canvasRef}
        suppressHydrationWarning
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(54% 58% at 50% 50%, rgba(255,255,255,0) 46%, rgba(255,255,255,0.2) 76%, #ffffff 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background: "linear-gradient(to bottom, #ffffff, transparent)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-32"
        style={{
          background: "linear-gradient(to right, #ffffff, transparent)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-32"
        style={{
          background: "linear-gradient(to left, #ffffff, transparent)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{
          background: "linear-gradient(to top, #ffffff, transparent)",
        }}
      />
    </section>
  );
};
