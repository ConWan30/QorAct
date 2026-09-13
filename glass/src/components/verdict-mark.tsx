import { cn } from "@/lib/utils";
import { Verdict, type Rollup } from "@/lib/qoract";

const COPY: Record<Verdict, { label: string; hint: string }> = {
  [Verdict.HUMAN_AUTHORED]: {
    label: "HUMAN_AUTHORED",
    hint: "Gamer-signed surface. Not a humanity claim.",
  },
  [Verdict.AGENT_AUTHORED]: {
    label: "AGENT_AUTHORED",
    hint: "Agent committed this span. Not a ban.",
  },
  [Verdict.MIXED]: {
    label: "MIXED",
    hint: "Both touched this span. Never rounded up.",
  },
  [Verdict.UNVERIFIABLE]: {
    label: "UNVERIFIABLE",
    hint: "The honest default. Empty HID stays here.",
  },
};

export function verdictTone(v: Verdict | null | undefined) {
  if (v === Verdict.HUMAN_AUTHORED) return "human";
  if (v === Verdict.AGENT_AUTHORED) return "agent";
  if (v === Verdict.MIXED) return "mixed";
  return "void";
}

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const tone = verdictTone(verdict);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.12em]",
        tone === "human" && "border-human/40 bg-human-dim text-human",
        tone === "agent" && "border-agent/40 bg-agent-dim text-agent",
        tone === "mixed" && "border-mixed/40 bg-mixed-dim text-mixed",
        tone === "void" && "border-dashed border-border text-muted-foreground",
      )}
    >
      {verdict}
    </span>
  );
}

export function VerdictStamp({
  verdict,
  rollup,
  kicker = "Outcome",
}: {
  verdict: Verdict;
  rollup?: Rollup | null;
  kicker?: string;
}) {
  const tone = verdictTone(verdict);
  const copy = COPY[verdict];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card p-6 sm:p-8",
        tone === "human" && "border-human/35",
        tone === "agent" && "border-agent/35",
        tone === "mixed" && "border-mixed/35",
        tone === "void" && "border-border",
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-current opacity-0" />
      <div
        className={cn(
          "absolute inset-y-3 left-3 w-px",
          tone === "human" && "bg-human",
          tone === "agent" && "bg-agent",
          tone === "mixed" && "bg-mixed",
          tone === "void" && "bg-border",
        )}
      />
      <p className="pl-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {kicker}
      </p>
      <h2
        className={cn(
          "mt-2 pl-4 font-display text-[clamp(1.6rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.03em] text-balance",
          tone === "human" && "text-human",
          tone === "agent" && "text-agent",
          tone === "mixed" && "text-mixed",
          tone === "void" && "text-foreground",
        )}
      >
        {copy.label}
      </h2>
      <p className="mt-3 max-w-xl pl-4 text-sm text-muted-foreground text-pretty">
        {copy.hint}
      </p>
      {rollup ? (
        <p className="mt-5 pl-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Rollup · {rollup}
        </p>
      ) : null}
    </div>
  );
}
