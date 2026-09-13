import { Eye, Scale, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANES = [
  {
    id: "truth",
    name: "QorTroller",
    speaks: "receipts · consent · eligibility",
    icon: Shield,
    active: false,
  },
  {
    id: "obs",
    name: "Qoresence",
    speaks: "coupling · Recap · empty glyphs",
    icon: Eye,
    active: false,
  },
  {
    id: "act",
    name: "QorAct",
    speaks: "HUMAN · AGENT · MIXED · UNVERIFIABLE",
    icon: Scale,
    active: true,
  },
] as const;

export function PlaneStrip() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {PLANES.map((p) => {
        const Icon = p.icon;
        return (
          <div
            key={p.id}
            className={cn(
              "rounded-md border px-4 py-3",
              p.active
                ? "border-[color-mix(in_oklab,#9be7ff_32%,transparent)] bg-card shadow-[0_0_0_1px_color-mix(in_oklab,#9be7ff_18%,transparent)]"
                : "border-border/70 bg-transparent text-muted-foreground",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="size-3.5" strokeWidth={1.75} />
              <span className="text-[11px] font-medium uppercase tracking-[0.16em]">
                {p.name}
              </span>
              {p.active ? (
                <span className="ml-auto font-mono text-[10px] tracking-[0.12em] text-primary">
                  THIS PLANE
                </span>
              ) : (
                <span className="ml-auto font-mono text-[10px] tracking-[0.12em]">
                  SIBLING
                </span>
              )}
            </div>
            <p className="mt-2 break-words font-mono text-[11px] leading-relaxed">{p.speaks}</p>
          </div>
        );
      })}
    </div>
  );
}
