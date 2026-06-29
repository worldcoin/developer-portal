"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const WORLD_LOGO_PATH =
  "M10 18.333q-2.26 0-4.176-1.122a8.3 8.3 0 0 1-3.036-3.036A8.1 8.1 0 0 1 1.667 10q0-2.26 1.121-4.176a8.3 8.3 0 0 1 3.036-3.035A8.1 8.1 0 0 1 10 1.666q2.26 0 4.176 1.122a8.35 8.35 0 0 1 3.036 3.035A8.13 8.13 0 0 1 18.333 10q0 2.261-1.121 4.176a8.3 8.3 0 0 1-3.036 3.036A8.13 8.13 0 0 1 10 18.333m-7.629-7.467V9.167h15.274v1.7zM10 16.597a6.3 6.3 0 0 0 3.281-.885 6.5 6.5 0 0 0 2.36-2.394q.867-1.509.866-3.316 0-1.807-.867-3.317a6.5 6.5 0 0 0-2.359-2.393A6.3 6.3 0 0 0 10 3.406a6.3 6.3 0 0 0-3.281.886 6.53 6.53 0 0 0-2.36 2.393q-.867 1.51-.866 3.317t.866 3.316a6.5 6.5 0 0 0 2.36 2.394q1.491.885 3.281.885m-4.447-6.473v-.217q0-1.283.614-2.322a4.35 4.35 0 0 1 1.726-1.636q1.113-.597 2.54-.596h5.585l.795 1.664h-6.308q-1.41 0-2.269.813-.859.814-.86 2.079v.218q.001 1.284.86 2.088.858.803 2.27.804h6.307l-.795 1.664h-5.585q-1.428-.001-2.54-.596a4.35 4.35 0 0 1-1.726-1.636q-.614-1.04-.614-2.322z";

const OVERLAY_RADIAL: CSSProperties = {
  background:
    "radial-gradient(54% 58% at 50% 50%, rgba(255,255,255,0) 46%, rgba(255,255,255,0.2) 76%, #ffffff 100%)",
};

const OVERLAY_TOP: CSSProperties = {
  background: "linear-gradient(to bottom, #ffffff, transparent)",
};

const OVERLAY_LEFT: CSSProperties = {
  background: "linear-gradient(to right, #ffffff, transparent)",
};

const OVERLAY_RIGHT: CSSProperties = {
  background: "linear-gradient(to left, #ffffff, transparent)",
};

const OVERLAY_BOTTOM: CSSProperties = {
  background: "linear-gradient(to top, #ffffff, transparent)",
};

const FILL_GLOW = "#9bf6ff";
const FILL_WHITE = "#ffffff";

type DrawCell = {
  blueBase: number;
  centerX: number;
  centerY: number;
  greenBase: number;
  index: number;
  isActive: boolean;
  logoAlpha: number;
  reveal: number;
  seed: number;
  size: number;
  spotlight: number;
  texture: number;
  x: number;
  y: number;
};

type Wave = {
  color: number;
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
    let resizeFrame = 0;
    // Timestamp of the first animated frame; drives the one-shot intro reveal.
    let startTime = -1;
    let visibleCells: DrawCell[] = [];
    let logoLayout = { left: 0, size: 1, top: 0 };
    let wave: Wave = {
      color: 0.5,
      coverage: 0.62,
      index: -1,
      salt: 0,
      x: 0.5,
      y: 0.5,
    };
    let lastFillRed = -1;
    let lastFillGreen = -1;
    let lastFillBlue = -1;
    let lastFillStyle = "";

    const random = (index: number, salt = 0) => {
      const value = Math.sin(index * 947.173 + salt * 117.31) * 10000;
      return value - Math.floor(value);
    };

    const fillStyleForCell = (
      cell: DrawCell,
      lift: number,
      flash: number,
      color: number,
    ) => {
      const red = clamp(
        Math.round(flash * (48 + color * 168) + lift * 10),
        0,
        230,
      );
      const green = clamp(
        Math.round(
          cell.greenBase +
            lift * 36 -
            flash * (72 - color * 28) +
            flash * color * 52,
        ),
        22,
        220,
      );
      const blue = clamp(
        Math.round(cell.blueBase + lift * 28 + flash * (46 + (1 - color) * 86)),
        120,
        255,
      );

      if (
        red === lastFillRed &&
        green === lastFillGreen &&
        blue === lastFillBlue
      ) {
        return lastFillStyle;
      }

      lastFillRed = red;
      lastFillGreen = green;
      lastFillBlue = blue;
      lastFillStyle = `rgb(${red},${green},${blue})`;
      return lastFillStyle;
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

    const recomputeWaveCellState = () => {
      const spotlightX = wave.x * width;
      const spotlightY = wave.y * height;

      const radius = Math.max(96, Math.min(width * 0.22, 220));

      for (const cell of visibleCells) {
        const dx = cell.centerX - spotlightX;
        const dy = cell.centerY - spotlightY;
        cell.spotlight = clamp(1 - Math.hypot(dx, dy) / radius, 0, 1);
        cell.isActive = random(cell.index, wave.salt) < wave.coverage;
      }
    };

    const rebuildGrid = () => {
      visibleCells = [];
      const logoMask = rebuildLogoMask();

      const size = width < 640 ? 7 : 8;
      const gap = width < 640 ? 3 : 4;
      const step = size + gap;
      const columns = Math.ceil(width / step) + 2;
      const rows = Math.ceil(height / step) + 2;
      const offsetX = (width - (columns - 1) * step - size) / 2;
      const offsetY = (height - (rows - 1) * step - size) / 2;
      const halfSize = size / 2;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column;
          const x = offsetX + column * step;
          const y = offsetY + row * step;
          const sampleX = clamp(Math.round(x + halfSize), 0, width - 1);
          const sampleY = clamp(Math.round(y + halfSize), 0, height - 1);
          const logoAlpha = logoMask
            ? logoMask[(sampleY * width + sampleX) * 4 + 3] / 255
            : 0;

          if (logoAlpha < 0.08) {
            continue;
          }

          const xMix = clamp((x - logoLayout.left) / logoLayout.size, 0, 1);
          const yMix = clamp((y - logoLayout.top) / logoLayout.size, 0, 1);

          visibleCells.push({
            blueBase: 206,
            centerX: x + halfSize,
            centerY: y + halfSize,
            greenBase: 136 - xMix * 58 - yMix * 14,
            index,
            isActive: false,
            logoAlpha,
            reveal: clamp((xMix + yMix) * 0.36 + random(index) * 0.2, 0, 0.82),
            seed: random(index),
            size,
            spotlight: 0,
            texture: random(index, 43) < 0.04 ? 0.55 : 1,
            x,
            y,
          });
        }
      }

      recomputeWaveCellState();
    };

    const updateWave = (seconds: number) => {
      const index = reduceMotion ? 0 : Math.floor(seconds);

      if (wave.index === index) {
        return;
      }

      wave = {
        color: random(index + 41, 13),
        coverage: 0.58 + random(index + 29, 7) * 0.32,
        index,
        salt: index + 1000,
        x: 0.08 + random(index + 31, 17) * 0.84,
        y: 0.2 + random(index + 37, 23) * 0.6,
      };

      recomputeWaveCellState();
    };

    const applyResize = () => {
      const rect = root.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.floor(rect.width));
      const nextHeight = Math.max(1, Math.floor(rect.height));
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

      if (nextWidth === width && nextHeight === height && nextDpr === dpr) {
        return;
      }

      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      rebuildGrid();
    };

    const scheduleResize = () => {
      if (resizeFrame) {
        return;
      }

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        applyResize();
      });
    };

    const draw = (time = 0) => {
      context.clearRect(0, 0, width, height);

      const seconds = time / 1000;

      if (startTime < 0 && time > 0) {
        startTime = time;
      }

      // One-shot intro: cells fill in part by part over ~2s, then the wave
      // flicker eases in over the following ~350ms.
      const introMs = startTime < 0 ? 0 : time - startTime;
      const intro = reduceMotion ? 1 : clamp(introMs / 2000, 0, 1);
      const flashGate = reduceMotion ? 1 : clamp((introMs - 2000) / 350, 0, 1);

      const progress = reduceMotion ? 0.5 : seconds - Math.floor(seconds);
      const pulse = reduceMotion
        ? 0.65
        : progress < 0.08
          ? progress / 0.08
          : progress < 0.36
            ? 1
            : clamp(1 - (progress - 0.36) / 0.16, 0, 1);
      updateWave(seconds);

      lastFillRed = -1;
      lastFillGreen = -1;
      lastFillBlue = -1;
      context.fillStyle = FILL_GLOW;

      for (const cell of visibleCells) {
        const revealFactor =
          intro >= 1 ? 1 : clamp((intro - cell.reveal) / 0.18, 0, 1);

        if (revealFactor <= 0) {
          continue;
        }

        const flicker = reduceMotion
          ? 1
          : 0.78 +
            Math.sin(seconds * 45 + cell.seed * 22) * 0.24 +
            random(cell.index, wave.salt + 3) * 0.3;
        const flash =
          (cell.isActive
            ? pulse * flicker * (0.72 + cell.spotlight * 1.4)
            : 0) * flashGate;
        const intensity = clamp(
          cell.logoAlpha * cell.texture * (0.48 + flash) * revealFactor,
          0,
          1,
        );

        if (intensity < 0.04) {
          continue;
        }

        context.globalAlpha = intensity;
        context.fillStyle = fillStyleForCell(
          cell,
          cell.spotlight,
          flash,
          wave.color,
        );
        context.fillRect(cell.x, cell.y, cell.size, cell.size);

        const glow = clamp(flash, 0, 1);

        context.globalAlpha = intensity * (0.144 + glow * 0.396);
        context.fillStyle = FILL_GLOW;
        context.fillRect(cell.x + 1, cell.y + 1, cell.size - 2, cell.size - 2);

        if (glow > 0.5) {
          context.globalAlpha = intensity * (glow - 0.5) * 1.44;
          context.fillStyle = FILL_WHITE;
          context.fillRect(
            cell.x + 2,
            cell.y + 2,
            cell.size - 4,
            cell.size - 4,
          );
        }
      }

      context.globalAlpha = 1;

      if (!reduceMotion) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleResize);
      observer.observe(root);
    } else {
      window.addEventListener("resize", scheduleResize);
    }

    applyResize();
    draw();

    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(resizeFrame);

      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener("resize", scheduleResize);
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
        style={OVERLAY_RADIAL}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={OVERLAY_TOP}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-32"
        style={OVERLAY_LEFT}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-32"
        style={OVERLAY_RIGHT}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={OVERLAY_BOTTOM}
      />
    </section>
  );
};
