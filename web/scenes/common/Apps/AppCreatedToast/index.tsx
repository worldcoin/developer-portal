"use client";

import { APP_CREATED_TOAST_STORAGE_KEY } from "@/lib/app-created-toast";
import { useEffect } from "react";
import { toast } from "react-toastify";

export const AppCreatedToast = () => {
  useEffect(() => {
    let appName: string | null = null;

    try {
      appName = window.sessionStorage.getItem(APP_CREATED_TOAST_STORAGE_KEY);
      window.sessionStorage.removeItem(APP_CREATED_TOAST_STORAGE_KEY);
    } catch {
      return;
    }

    if (!appName) {
      return;
    }

    toast.success(
      <span>
        New app <b>{appName}</b> was created
      </span>,
    );
  }, []);

  return null;
};
