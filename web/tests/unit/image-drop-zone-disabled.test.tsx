/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";

import { ImageDropZone } from "@/components/ImageDropZone";

// #region Test Data
const file = new File(["image"], "content-card.png", { type: "image/png" });
const dropEvent = {
  dataTransfer: {
    files: [file],
    items: [
      {
        kind: "file",
        type: file.type,
        getAsFile: () => file,
      },
    ],
    types: ["Files"],
  },
};

const dropFile = async () => {
  const dropZone = screen.getByText("Drop image").closest("label");
  if (!dropZone) throw new Error("Image drop zone not found");

  await act(async () => {
    fireEvent.drop(dropZone, dropEvent);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const renderDropZone = (disabled: boolean, uploadImage: jest.Mock) =>
  render(
    <ImageDropZone
      disabled={disabled}
      width={345}
      height={240}
      imageType="content_card_image"
      uploadImage={uploadImage}
    >
      <span>Drop image</span>
    </ImageDropZone>,
  );
// #endregion

// #region Disabled behavior
describe("ImageDropZone [disabled]", () => {
  it("accepts a dropped file when enabled", async () => {
    const uploadImage = jest.fn();
    renderDropZone(false, uploadImage);

    await dropFile();

    expect(uploadImage).toHaveBeenCalledWith(
      "content_card_image",
      file,
      240,
      345,
    );
  });

  it("blocks a dropped file when disabled", async () => {
    const uploadImage = jest.fn();
    renderDropZone(true, uploadImage);

    const input = screen
      .getByText("Drop image")
      .closest("label")
      ?.querySelector("input");
    expect(input).toBeDisabled();
    await dropFile();

    expect(uploadImage).not.toHaveBeenCalled();
  });
});
// #endregion
