"use client";

import { useEffect, useRef } from "react";

type MobileNavLink = {
  external: boolean;
  href: string;
  label: string;
};

const linkClassName = "rounded-xl px-4 py-4 no-underline hover:bg-grey-50";

// Client island for the home header's mobile menu. Kept separate so the
// layout stays a server component. The menu is a native <details>; we only
// close it imperatively (a bare <details> would stay open after tapping a
// link that opens in a new tab).
export const HomeMobileNav = ({
  links,
}: {
  links: ReadonlyArray<MobileNavLink>;
}) => {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const close = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const details = detailsRef.current;

      if (details?.open && !details.contains(event.target as Node)) {
        details.open = false;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details className="group relative md:hidden" ref={detailsRef}>
      <summary
        aria-label="Open navigation menu"
        className="grid size-10 cursor-pointer list-none place-items-center text-black [&::-webkit-details-marker]:hidden"
      >
        <span className="grid gap-1">
          <span className="block h-0.5 w-[26px] bg-current" />
          <span className="block h-0.5 w-[26px] bg-current" />
          <span className="block h-0.5 w-[26px] bg-current" />
        </span>
      </summary>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-2 top-16 hidden rounded-2xl border border-grey-100 bg-white p-2 font-world text-[16px] leading-none tracking-[0.08em] text-black shadow-lg group-open:grid"
      >
        {links.map((link) => (
          <a
            className={linkClassName}
            href={link.href}
            key={link.label}
            onClick={close}
            rel={link.external ? "noopener noreferrer" : undefined}
            target={link.external ? "_blank" : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </details>
  );
};
