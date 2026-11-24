"use client";

import { useEffect } from "react";
import { toast } from "react-toastify";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    toast.error("Unable to load the admin dashboard. Please try again.", {
      toastId: "admin-dashboard-load-error",
    });
  }, [error]);

  return (
    <div className="flex size-full min-h-0 items-center justify-center p-5">
      <section
        aria-live="assertive"
        className="w-full max-w-xl rounded-16 border border-red-200 bg-red-50 p-5 text-grey-900"
        role="alert"
      >
        <h1 className="text-20 font-semibold">Dashboard unavailable</h1>
        <p className="mt-2 text-14 text-grey-700">
          The dashboard data could not be loaded. The rest of the admin
          navigation is still available.
        </p>
        <button
          className="mt-4 rounded-8 bg-grey-900 px-4 py-2 text-14 font-medium text-grey-0 transition-colors hover:bg-grey-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </div>
  );
}
