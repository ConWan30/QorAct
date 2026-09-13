import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VerdictChip, VerdictStamp } from "@/components/verdict-mark";
import { recordToDict, Verdict, type MediaSpan, type QorActRecord } from "@/lib/qoract";
import { useWorkspace } from "@/lib/workspace";

export function RecordBoard() {
  const record = useWorkspace((s) => s.record);
  const health = useWorkspace((s) => s.health);
  const verify = useWorkspace((s) => s.verify);
  const fixtureId = useWorkspace((s) => s.fixtureId);

  if (!record) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card/40 px-5 py-12 text-center">
        <p className="font-display text-xl tracking-[-0.02em]">No draft yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground text-pretty">
          Load a contract fixture or drop a Recap. The door still issues if the
          payload is garbage.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <VerdictStamp
        verdict={record.outcome?.verdict ?? Verdict.UNVERIFIABLE}
        rollup={record.rollup}
      />

      <MetaGrid record={record} />

      <MediaList media={record.media} />

      <Honesty record={record} />

      <div className="grid gap-3 sm:grid-cols-2">
        <StampCard
          title="Stranger verify"
          ok={verify?.ok ?? false}
          lines={
            verify?.ok
              ? ["clock recomputes", "live:false", "schema qoract-record-1"]
              : (verify?.reasons ?? ["not verified"])
          }
        />
        <StampCard
          title="Door health"
          ok={Boolean(health?.issued) && health?.live === false}
          lines={[
            `fail_open ${String(health?.fail_open)}`,
            `humanity_claim ${String(health?.humanity_claim)}`,
            `sidecar_used ${String(health?.sidecar_used)}`,
            `media_spans ${String(health?.media_spans)}`,
          ]}
        />
      </div>

      {record.hygiene_note ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {record.hygiene_note}
        </p>
      ) : null}

      <DraftJson record={record} fixtureId={fixtureId} />
    </div>
  );
}

function MetaGrid({ record }: { record: QorActRecord }) {
  const rows = [
    ["schema", record.schema],
    ["live", String(record.live)],
    ["sealed", String(record.sealed)],
    ["session", record.session_id ?? "—"],
    ["outcome.agent", record.outcome?.agent_actuator ?? "—"],
    ["HID bodied", String(record.outcome?.hid_bodied_on_host ?? false)],
    ["IVC joined", String(record.outcome?.ivc_joined ?? false)],
    ["KAS", record.outcome?.kas_commitment ?? "—"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
      {rows.map(([k, v]) => (
        <div key={k} className="min-w-0 bg-card px-3 py-3">
          <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {k}
          </dt>
          <dd className="mt-1 truncate font-mono text-xs" title={v}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function MediaList({ media }: { media: MediaSpan[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-base font-medium tracking-[-0.02em]">
          Media spans
        </h3>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {media.length} committed
        </span>
      </div>
      {media.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground text-pretty">
          Empty. Recap clips, arm-without-file, and path=hold do not mint spans.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {media.map((s, i) => (
            <li
              key={`${s.kind}-${s.stem ?? s.ticket_id}-${i}`}
              className="flex flex-col gap-2 rounded-md border border-border bg-background/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.12em]">
                  {s.kind} · {s.path} · {s.source}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {s.stem ?? (s.ticket_id || "no ticket")}
                </p>
              </div>
              <VerdictChip verdict={s.verdict} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Honesty({ record }: { record: QorActRecord }) {
  const lists = [
    ["deployed_verified", record.honesty.deployed_verified],
    ["emulated", record.honesty.emulated],
    ["undeployed", record.honesty.undeployed],
  ] as const;
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="font-display text-base font-medium tracking-[-0.02em]">
        Honesty
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        producer_status ignored · kinds v0 pixels/speech · outcome actuator
        undeployed
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {lists.map(([name, value]) => (
          <div key={name}>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {name}
            </p>
            <ul className="mt-2 grid gap-1">
              {Array.isArray(value) && value.length > 0 ? (
                value.map((item) => (
                  <li key={String(item)} className="font-mono text-xs">
                    {String(item)}
                  </li>
                ))
              ) : (
                <li className="font-mono text-xs text-muted-foreground">none</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function StampCard({
  title,
  ok,
  lines,
}: {
  title: string;
  ok: boolean;
  lines: string[];
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-medium tracking-[-0.02em]">
          {title}
        </h3>
        <span
          className={
            ok
              ? "font-mono text-[11px] tracking-[0.14em] text-agent"
              : "font-mono text-[11px] tracking-[0.14em] text-mixed"
          }
        >
          {ok ? "OK" : "HOLD"}
        </span>
      </div>
      <ul className="mt-3 grid gap-1">
        {lines.map((line) => (
          <li key={line} className="font-mono text-xs text-muted-foreground">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DraftJson({
  record,
  fixtureId,
}: {
  record: QorActRecord;
  fixtureId: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(recordToDict(record), null, 2);

  async function copy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function download() {
    const blob = new Blob([json + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qoract-${record.session_id ?? fixtureId ?? "draft"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-medium tracking-[-0.02em]">
          qoract-record-1
        </h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={download}>
            <Download className="size-3.5" />
            Download
          </Button>
        </div>
      </div>
      <pre className="mt-3 max-h-72 max-w-full overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {json}
      </pre>
    </section>
  );
}
