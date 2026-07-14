"use client";

import { CopyButton } from "@/components/CopyButton";

export const HeroCard = (props: { name: string; appId: string }) => (
  <div className="rounded-[10px] border border-portal-border bg-white p-6 shadow-portal-card">
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-world text-19 font-medium text-portal-heading">
        {props.name}
      </span>
      <span className="flex items-center gap-1 rounded-8 bg-portal-canvas px-2 py-1">
        <span className="font-ibm text-12 text-portal-muted">
          {props.appId}
        </span>
        <CopyButton
          fieldName="App ID"
          fieldValue={props.appId}
          className="text-portal-muted"
        />
      </span>
    </div>
  </div>
);
