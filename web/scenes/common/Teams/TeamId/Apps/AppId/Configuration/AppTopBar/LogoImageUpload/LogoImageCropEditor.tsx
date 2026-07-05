import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  ImageDimensions,
  clamp,
  createSquareCroppedImageFile,
} from "./crop-logo-image";

const MAX_PREVIEW_HEIGHT = 320;
const KEYBOARD_STEP_IMAGE_PX = 16;

type LogoImageCropEditorProps = {
  file: File;
  disabled?: boolean;
  onCancel: () => void;
  onCrop: (file: File) => Promise<void>;
};

type DragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
};

export const LogoImageCropEditor = (props: LogoImageCropEditorProps) => {
  const { file, disabled = false, onCancel, onCrop } = props;
  const measureRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] =
    useState<ImageDimensions | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  // Top-left corner of the square crop window, in natural image pixels.
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      imageRef.current = image;
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      const size = Math.min(dimensions.width, dimensions.height);
      setOrigin({
        x: (dimensions.width - size) / 2,
        y: (dimensions.height - size) / 2,
      });
      setImageDimensions(dimensions);
      setPreviewUrl(url);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error("Error loading image");
      onCancel();
    };

    image.src = url;

    return () => {
      imageRef.current = null;
      setPreviewUrl(null);
      setImageDimensions(null);
      URL.revokeObjectURL(url);
    };
  }, [file, onCancel]);

  useEffect(() => {
    const element = measureRef.current;

    if (!element) {
      return;
    }

    const update = () => setAvailableWidth(element.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const cropSize = imageDimensions
    ? Math.min(imageDimensions.width, imageDimensions.height)
    : 0;

  const scale = useMemo(() => {
    if (!imageDimensions || availableWidth === 0) {
      return 0;
    }

    return Math.min(
      availableWidth / imageDimensions.width,
      MAX_PREVIEW_HEIGHT / imageDimensions.height,
    );
  }, [availableWidth, imageDimensions]);

  const moveOrigin = useCallback(
    (deltaX: number, deltaY: number, fromX: number, fromY: number) => {
      if (!imageDimensions) {
        return;
      }

      setOrigin({
        x: clamp(fromX + deltaX, 0, imageDimensions.width - cropSize),
        y: clamp(fromY + deltaY, 0, imageDimensions.height - cropSize),
      });
    },
    [cropSize, imageDimensions],
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || isCropping || scale === 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: origin.x,
      originY: origin.y,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId || scale === 0) {
      return;
    }

    moveOrigin(
      (event.clientX - drag.startClientX) / scale,
      (event.clientY - drag.startClientY) / scale,
      drag.originX,
      drag.originY,
    );
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || isCropping) {
      return;
    }

    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-KEYBOARD_STEP_IMAGE_PX, 0],
      ArrowRight: [KEYBOARD_STEP_IMAGE_PX, 0],
      ArrowUp: [0, -KEYBOARD_STEP_IMAGE_PX],
      ArrowDown: [0, KEYBOARD_STEP_IMAGE_PX],
    };

    const step = steps[event.key];

    if (!step) {
      return;
    }

    event.preventDefault();
    moveOrigin(step[0], step[1], origin.x, origin.y);
  };

  const handleCrop = useCallback(async () => {
    const image = imageRef.current;

    if (!image || !imageDimensions) {
      return;
    }

    setIsCropping(true);

    try {
      const croppedFile = await createSquareCroppedImageFile(file, image, {
        x: origin.x,
        y: origin.y,
        size: cropSize,
      });
      await onCrop(croppedFile);
    } catch (error) {
      console.error("Logo Crop Failed: ", error);
      toast.error("Error cropping image");
    } finally {
      setIsCropping(false);
    }
  }, [cropSize, file, imageDimensions, onCrop, origin]);

  return (
    <div className="grid gap-y-6">
      <div className="grid justify-items-center gap-y-4 rounded-xl border border-grey-200 p-4">
        <div ref={measureRef} className="grid w-full justify-items-center">
          {previewUrl && imageDimensions && scale > 0 ? (
            <div
              role="application"
              aria-label="Drag the highlighted circle to choose the visible area"
              tabIndex={0}
              className="relative cursor-grab touch-none select-none overflow-hidden rounded-lg outline-offset-2 active:cursor-grabbing"
              style={{
                width: imageDimensions.width * scale,
                height: imageDimensions.height * scale,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onKeyDown={handleKeyDown}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Logo crop preview"
                draggable={false}
                className="pointer-events-none block size-full"
              />
              {/* Circular window previews how the logo renders; everything outside
                  the crop square's inscribed circle is dimmed via the shadow. */}
              <div
                className="pointer-events-none absolute rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                style={{
                  left: origin.x * scale,
                  top: origin.y * scale,
                  width: cropSize * scale,
                  height: cropSize * scale,
                }}
              />
            </div>
          ) : (
            <div className="aspect-square w-full max-w-72 rounded-2xl bg-grey-100" />
          )}
        </div>
        <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
          Drag the highlighted circle to choose the visible area
        </Typography>
      </div>

      <div className="grid w-full grid-cols-2 gap-x-4">
        <DecoratedButton
          type="button"
          variant="secondary"
          disabled={disabled || isCropping}
          onClick={onCancel}
          className="w-full"
        >
          Back
        </DecoratedButton>
        <DecoratedButton
          type="button"
          disabled={disabled || isCropping || scale === 0}
          loading={isCropping}
          onClick={handleCrop}
          className="w-full"
        >
          Save crop
        </DecoratedButton>
      </div>
    </div>
  );
};
