"use client";

import { CodeBlock } from "@/components/CodeBlock";
import { Chart } from "@/components/Chart";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Radio } from "@/components/Radio";
import { Switcher } from "@/components/Switch";
import { Toggle } from "@/components/Toggle";
import { TotalsFunnel } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame/TotalsFunnel";
import type { DailyRow } from "@/lib/selfie-check-analytics";
import { ThemeMenu } from "@/components/ThemeMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import { DailyMetricChart } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame/DailyMetricChart";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";

export function ThemePreview() {
  const [section, setSection] = useState("Overview");
  const [toggle, setToggle] = useState(false);
  const [radio, setRadio] = useState("first");
  const rows: DailyRow[] = Array.from({ length: 7 }, (_, day) =>
    ["Android", "iOS"].map((os, index) => ({
      appId: "synthetic-preview",
      day: `2026-09-${String(day + 1).padStart(2, "0")}`,
      os_name: os,
      n_users_started_selfie_check_flow: 100 + day * 12 + index * 8,
      n_users_shared_a_proof: 80 + day * 10 + index * 5,
      cumulative_n_users_shared_a_proof: 80 * (day + 1),
      p_face_capture_completion: 0.72 + day * 0.03 + index * 0.04,
    })),
  ).flat();
  return (
    <div className="min-h-screen bg-portal-canvas font-world text-portal-text">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-portal-border px-6 py-4">
        <div>
          <h1 className="text-20 font-semibold">Developer Portal</h1>
          <p className="text-13 text-portal-muted">
            Local component preview · synthetic content
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Appearance</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ThemeMenu />
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[180px_1fr] md:p-8">
        <nav aria-label="Preview sections" className="flex gap-2 md:flex-col">
          {["Overview", "Forms", "Analytics"].map((name) => (
            <button
              key={name}
              aria-current={section === name ? "page" : undefined}
              onClick={() => setSection(name)}
              className={`rounded-8 px-4 py-3 text-left text-14 transition-colors ${section === name ? "bg-surface-muted text-portal-text" : "text-portal-muted hover:bg-surface-soft"}`}
            >
              {name}
            </button>
          ))}
        </nav>
        <main className="min-w-0 space-y-6">
          <div>
            <h2 className="text-26 font-semibold text-portal-heading">
              {section}
            </h2>
            <p className="mt-2 text-14 text-portal-muted">
              Manage your integration and verify every state.
            </p>
          </div>
          {section === "Overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-16 border border-portal-border bg-surface p-6">
                  <h3 className="text-18 font-medium">World ID</h3>
                  <p className="my-4 text-14 text-portal-muted">
                    Verify unique humans with privacy-preserving proofs.
                  </p>
                  <InkButton type="button" onClick={() => setSection("Forms")}>
                    Configure integration
                  </InkButton>
                </section>
                <section className="rounded-16 border border-portal-border bg-surface p-6">
                  <h3 className="text-18 font-medium">Mini App</h3>
                  <p className="my-4 text-14 text-portal-muted">
                    Build an experience for people around the world.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => toast.success("Preview settings saved")}
                  >
                    Preview success toast
                  </Button>
                </section>
              </div>
              <section className="rounded-16 border border-portal-border bg-surface p-6">
                <h3 className="mb-4 font-medium">Status and loading</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <p className="rounded-8 bg-surface-info-soft p-3 text-content-link">
                    Ready to integrate
                  </p>
                  <p className="rounded-8 bg-surface-success-50 p-3 text-content-success-500">
                    Verification active
                  </p>
                  <p className="rounded-8 bg-surface-warning-75 p-3 text-content-warning-650">
                    Review pending
                  </p>
                </div>
                <div className="mt-5">
                  <Skeleton count={2} />
                </div>
              </section>
              <CodeBlock
                code={
                  'const result = await verify({\n  appId: "app_example",\n  enabled: true, // protect user privacy\n});'
                }
                theme="neutral"
                language="javascript"
                caption="Integration example"
                showLineNumbers
              />
            </>
          )}
          {section === "Forms" && (
            <section className="space-y-5 rounded-16 border border-portal-border bg-surface p-6">
              <div className="flex flex-wrap gap-3">
                {(
                  ["primary", "secondary", "danger", "destructive"] as const
                ).map((variant) => (
                  <DecoratedButton
                    key={variant}
                    type="button"
                    variant={variant}
                    showArrowRight
                  >
                    {variant}
                  </DecoratedButton>
                ))}
                <DecoratedButton type="button" loading>
                  Loading action
                </DecoratedButton>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2">
                  Legacy switch
                  <Switcher enabled={toggle} setEnabled={setToggle} />
                </label>
                <label className="flex items-center gap-2">
                  Toggle
                  <Toggle checked={toggle} onChange={setToggle} />
                </label>
                <Radio
                  label="First option"
                  aria-label="First option"
                  name="preview-radio"
                  value="first"
                  checked={radio === "first"}
                  onChange={() => setRadio("first")}
                />
                <Radio
                  label="Second option"
                  aria-label="Second option"
                  name="preview-radio"
                  value="second"
                  checked={radio === "second"}
                  onChange={() => setRadio("second")}
                />
              </div>
              <div>
                <label htmlFor="preview-name" className="mb-2 block text-14">
                  Application name
                </label>
                <Input id="preview-name" defaultValue="Example app" />
              </div>
              <div>
                <label htmlFor="preview-url" className="mb-2 block text-14">
                  Callback URL
                </label>
                <Input
                  id="preview-url"
                  placeholder="https://example.com/callback"
                  aria-invalid="true"
                  aria-describedby="preview-error"
                />
                <p
                  id="preview-error"
                  className="mt-2 text-13 text-content-error-500"
                >
                  Enter a valid callback URL.
                </p>
              </div>
              <div>
                <label
                  htmlFor="preview-disabled"
                  className="mb-2 block text-14"
                >
                  Managed identifier
                </label>
                <Input id="preview-disabled" value="app_example" disabled />
              </div>
              <div className="flex flex-wrap gap-3">
                <InkButton
                  type="button"
                  onClick={() => toast.success("Preview settings saved")}
                >
                  Save preview
                </InkButton>
                <Button disabled>Unavailable</Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Open settings panel</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Integration settings</SheetTitle>
                      <SheetDescription>
                        Review dialog surfaces, close controls, and keyboard
                        focus.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="p-4">
                      <Input
                        aria-label="Panel application name"
                        defaultValue="Example app"
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </section>
          )}
          {section === "Analytics" && (
            <>
              <DailyMetricChart
                title="Verification rate"
                rows={rows}
                metric="p_face_capture_completion"
                kind="rate"
                chartType="line"
                yAxisLabel="Success rate"
              />
              <DailyMetricChart
                title="Sessions by OS"
                rows={rows}
                metric="n_users_started_selfie_check_flow"
                kind="count"
                chartType="bar"
                yAxisLabel="Sessions"
              />
              <DailyMetricChart
                title="No data"
                rows={[]}
                metric="p_face_capture_completion"
                kind="rate"
                chartType="line"
                yAxisLabel="Success rate"
              />
              <TotalsFunnel
                row={{
                  appId: "synthetic-preview",
                  n_users_started_at_least_one_selfie_check_flow: 1000,
                  n_users_shared_at_least_one_proof: 650,
                  n_selfie_check_started_sessions: 1000,
                  n_face_capture_started_sessions: 900,
                  n_face_capture_completed_sessions: 750,
                  n_proof_shared_sessions: 650,
                  p_selfie_check_to_face_capture_started_completion: 0.9,
                  p_face_capture_started_to_completed_completion: 0.83,
                  p_face_capture_completed_to_proof_shared_completion: 0.87,
                }}
              />
              <section
                aria-label="Legacy canvas chart"
                className="rounded-16 border border-portal-border bg-surface p-6"
              >
                <h3>Legacy canvas chart</h3>
                <Chart
                  data={{
                    x: ["Mon", "Tue", "Wed"],
                    y: [
                      {
                        label: "Verifications",
                        data: [10, 18, 14],
                        borderColor: "#4940e0",
                      },
                    ],
                  }}
                />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
