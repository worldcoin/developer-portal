/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { LogoDropZone } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/LogoDropZone";
import { fireEvent, render, screen } from "@testing-library/react";

// #region Tests
// A metadata row that names a logo file yields a truthy signed URL even when
// the object is missing from the bucket, so the `imageUrl &&` guard alone let a
// broken <img> paint its alt text across the drop zone.
describe("LogoDropZone [broken image]", () => {
  // The empty state's share icon is an <img> too, so match on the logo host.
  const logoImg = () => document.querySelector('img[src^="https://cdn."]');

  const renderZone = (imageUrl?: string) =>
    render(<LogoDropZone imageUrl={imageUrl} onFileSelected={jest.fn()} />)
      .rerender;

  it("falls back to the empty state when the logo fails to load", () => {
    renderZone("https://cdn.example/unverified/missing.png");
    expect(screen.queryByText(/Drop an image/)).toBeNull();

    fireEvent.error(logoImg()!);

    expect(screen.getByText(/Drop an image/)).toBeInTheDocument();
    expect(logoImg()).toBeNull();
  });

  it("keeps the file input named while a logo covers the label", () => {
    renderZone("https://cdn.example/unverified/uploaded.png");

    expect(screen.getByLabelText(/Upload app logo/)).toHaveAttribute(
      "type",
      "file",
    );
  });

  it("retries when a new logo url arrives after a failure", () => {
    const rerender = renderZone("https://cdn.example/unverified/missing.png");
    fireEvent.error(logoImg()!);

    rerender(
      <LogoDropZone
        imageUrl="https://cdn.example/unverified/uploaded.png"
        onFileSelected={jest.fn()}
      />,
    );

    expect(logoImg()).toHaveAttribute(
      "src",
      "https://cdn.example/unverified/uploaded.png",
    );
  });
});
// #endregion
