import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AppHeader } from "@/components/app-header";
import { FixtureRail } from "@/components/fixture-rail";
import { LawsRail } from "@/components/laws-rail";
import { PlaneStrip } from "@/components/plane-strip";
import { RecapDoor } from "@/components/recap-door";
import { RecordBoard } from "@/components/record-board";
import { SpanBuilder } from "@/components/span-builder";
import { useWorkspace } from "@/lib/workspace";
import "./styles.css";

function App() {
  const loadFixture = useWorkspace((s) => s.loadFixture);
  const record = useWorkspace((s) => s.record);

  useEffect(() => {
    if (!record) void loadFixture("empty-hid");
  }, [loadFixture, record]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <PlaneStrip />
        <FixtureRail />
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="grid min-w-0 gap-4 self-start">
            <RecapDoor />
            <SpanBuilder />
            <LawsRail />
          </div>
          <div className="min-w-0">
            <RecordBoard />
          </div>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          GitHub Pages · live:false · fail-open Recap door · client verify
        </p>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
