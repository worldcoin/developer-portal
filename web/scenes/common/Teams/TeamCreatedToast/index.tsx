"use client";

import { TEAM_CREATED_TOAST_STORAGE_KEY } from "@/lib/team-created-toast";
import { useEffect } from "react";
import { toast } from "react-toastify";

export const TeamCreatedToast = () => {
  useEffect(() => {
    let teamName: string | null = null;

    try {
      teamName = window.sessionStorage.getItem(TEAM_CREATED_TOAST_STORAGE_KEY);
      window.sessionStorage.removeItem(TEAM_CREATED_TOAST_STORAGE_KEY);
    } catch {
      return;
    }

    if (!teamName) {
      return;
    }

    toast.success(
      <span>
        New team <b>{teamName}</b> was created
      </span>,
    );
  }, []);

  return null;
};
