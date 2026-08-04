/** @jest-environment jsdom */
import { act, render } from "@testing-library/react";
import React from "react";
import { useForm } from "react-hook-form";
import { useAutosave } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-autosave";

/**
 * `shouldDirty: false` alone does not stop an image field's write-back from
 * queueing a full-form save: RHF notifies `watch` subscribers on every
 * setValue regardless of dirty flags.
 */

const DEBOUNCE_MS = 1500;

type Values = {
  name: string;
  localisations: { showcase_img_urls: string[]; meta_tag_image_url: string }[];
};

const save = jest.fn<Promise<void>, [Values, AbortSignal]>();

let api: {
  setValue: ReturnType<typeof useForm<Values>>["setValue"];
} | null = null;

const Harness = ({
  isSelfPersisting,
  onSaved,
}: {
  isSelfPersisting?: (name: string) => boolean;
  onSaved?: (values: Values) => void;
}) => {
  const form = useForm<Values>({
    defaultValues: {
      name: "app",
      localisations: [{ showcase_img_urls: [], meta_tag_image_url: "" }],
    },
  });

  useAutosave<Values>({
    form,
    enabled: true,
    debounceMs: DEBOUNCE_MS,
    save: (...args) => save(...args),
    onStatus: () => {},
    onSaved,
    isSelfPersisting,
  });

  api = { setValue: form.setValue };
  return null;
};

const settle = async () => {
  await act(async () => {
    jest.advanceTimersByTime(DEBOUNCE_MS + 50);
    await Promise.resolve();
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  save.mockReset();
  save.mockResolvedValue(undefined);
  api = null;
});

afterEach(() => {
  jest.useRealTimers();
});

describe("autosave and self-persisting fields", () => {
  it("publishes form values only after autosave succeeds", async () => {
    const onSaved = jest.fn();
    render(<Harness onSaved={onSaved} />);

    act(() => {
      api!.setValue("name", "renamed", { shouldDirty: true });
    });

    expect(onSaved).not.toHaveBeenCalled();

    await settle();

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onSaved.mock.calls[0][0].name).toBe("renamed");
  });

  it("does not publish form values when autosave fails", async () => {
    const onSaved = jest.fn();
    save.mockRejectedValueOnce(new Error("save failed"));
    render(<Harness onSaved={onSaved} />);

    act(() => {
      api!.setValue("name", "renamed", { shouldDirty: true });
    });
    await settle();

    expect(save).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("skips the full-form save when a self-persisting field writes back", async () => {
    render(
      <Harness
        isSelfPersisting={(name) =>
          /^localisations\.\d+\.(showcase_img_urls|meta_tag_image_url)$/.test(
            name,
          )
        }
      />,
    );

    act(() => {
      api!.setValue("localisations.0.showcase_img_urls", ["a.png"], {
        shouldDirty: false,
      });
    });
    await settle();

    expect(save).not.toHaveBeenCalled();
  });

  it("still saves the image-adjacent case of a genuine user edit", async () => {
    render(
      <Harness
        isSelfPersisting={(name) =>
          /^localisations\.\d+\.(showcase_img_urls|meta_tag_image_url)$/.test(
            name,
          )
        }
      />,
    );

    act(() => {
      api!.setValue("name", "renamed", { shouldDirty: true });
    });
    await settle();

    expect(save).toHaveBeenCalledTimes(1);
  });

  it("saves image writes when no predicate is supplied", async () => {
    // Guards the default: other forms using useAutosave must be unaffected.
    render(<Harness />);

    act(() => {
      api!.setValue("localisations.0.meta_tag_image_url", "m.png", {
        shouldDirty: false,
      });
    });
    await settle();

    expect(save).toHaveBeenCalledTimes(1);
  });

  it("does not let a skipped write suppress a following real edit", async () => {
    // Guards that the skip stays a plain early return — clearing the pending
    // flag or debounce bookkeeping would swallow the keystroke's save.
    render(
      <Harness
        isSelfPersisting={(name) =>
          /^localisations\.\d+\.(showcase_img_urls|meta_tag_image_url)$/.test(
            name,
          )
        }
      />,
    );

    act(() => {
      api!.setValue("localisations.0.showcase_img_urls", ["a.png"], {
        shouldDirty: false,
      });
      api!.setValue("name", "renamed", { shouldDirty: true });
    });
    await settle();

    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].name).toBe("renamed");
    // Skipped as a *trigger*, not excluded from the payload.
    expect(save.mock.calls[0][0].localisations[0].showcase_img_urls).toEqual([
      "a.png",
    ]);
  });
});
