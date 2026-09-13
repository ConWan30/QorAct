import { FIXTURES, Verdict, type QorActRecord } from "@/lib/qoract";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

const LAWS: {
  id: string;
  title: string;
  check: (r: QorActRecord) => boolean;
}[] = [
  {
    id: "undeployed",
    title: "Outcome-agent undeployed",
    check: (r) => r.outcome?.agent_actuator === "undeployed",
  },
  {
    id: "empty-hid",
    title: "Empty HID ⇒ UNVERIFIABLE",
    check: (r) => {
      if (!r.outcome) return false;
      const o = r.outcome;
      if (o.kas_commitment) return o.verdict === Verdict.HUMAN_AUTHORED;
      if (o.hid_bodied_on_host && o.ivc_joined) {
        return o.verdict === Verdict.HUMAN_AUTHORED;
      }
      return o.verdict === Verdict.UNVERIFIABLE;
    },
  },
  {
    id: "arm",
    title: "Arm without file is not pixels",
    check: () => true,
  },
  {
    id: "hold",
    title: "path=hold is not speech",
    check: () => true,
  },
  {
    id: "confirm",
    title: "Confirm-path chat is AGENT speech",
    check: (r) =>
      r.media.every(
        (s) =>
          s.kind !== "speech" ||
          (s.path !== "confirm" && s.path !== "fast") ||
          s.verdict === Verdict.AGENT_AUTHORED ||
          s.verdict === Verdict.MIXED,
      ),
  },
  {
    id: "status",
    title: "Producer status ignored",
    check: (r) => r.honesty.producer_status_ignored === true,
  },
  {
    id: "live",
    title: "live:true forbidden",
    check: (r) => r.live === false,
  },
  {
    id: "hold-human",
    title: "Human HOLD beats PASS",
    check: () => true,
  },
];

export function LawsRail() {
  const record = useWorkspace((s) => s.record);
  const fixtureId = useWorkspace((s) => s.fixtureId);
  const law = FIXTURES.find((f) => f.id === fixtureId)?.law;

  return (
    <aside className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
        Fail-closed laws
      </h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        Reference-and-bind only. No FROZEN primitive. No chain writes.
      </p>
      <ol className="mt-4 grid gap-2">
        {LAWS.map((lawItem, i) => {
          const held = record ? lawItem.check(record) : null;
          return (
            <li
              key={lawItem.id}
              className="flex items-start gap-3 rounded-md border border-transparent px-1 py-1.5"
            >
              <span className="mt-0.5 w-5 font-mono text-[11px] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm leading-snug">{lawItem.title}</span>
              <span
                className={cn(
                  "mt-0.5 font-mono text-[10px] tracking-[0.12em]",
                  held === null && "text-muted-foreground",
                  held === true && "text-agent",
                  held === false && "text-mixed",
                )}
              >
                {held === null ? "—" : held ? "HOLD" : "BREAK"}
              </span>
            </li>
          );
        })}
      </ol>
      {law ? (
        <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground text-pretty">
          {law}
        </p>
      ) : null}
    </aside>
  );
}
