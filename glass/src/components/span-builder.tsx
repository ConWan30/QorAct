import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/lib/workspace";
import type { MediaActuatorRow } from "@/lib/qoract";

const KINDS = ["pixels", "speech"] as const;
const PATHS = ["fast", "confirm", "operator", "hold", "leftover", "absent"] as const;
const SOURCES = [
  "clutchbot",
  "studio",
  "operator",
  "arm",
  "local_hdmi",
  "match_agent",
  "mcp",
  "twitch_clip",
] as const;

export function SpanBuilder() {
  const actuatorText = useWorkspace((s) => s.actuatorText);
  const setActuatorText = useWorkspace((s) => s.setActuatorText);
  const [kind, setKind] = useState<(typeof KINDS)[number]>("speech");
  const [path, setPath] = useState<(typeof PATHS)[number]>("fast");
  const [source, setSource] = useState<(typeof SOURCES)[number]>("clutchbot");
  const [ticket, setTicket] = useState("tick-1");
  const [text, setText] = useState("Score update: 21-3.");
  const [stem, setStem] = useState("hdmi_clip_aa");
  const [commit, setCommit] = useState(true);
  const [armed, setArmed] = useState(false);
  const [operatorPost, setOperatorPost] = useState(false);

  function currentLog(): MediaActuatorRow[] {
    const raw = actuatorText.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as MediaActuatorRow[];
    } catch {
      return [];
    }
    return [];
  }

  function addSpan() {
    const row: MediaActuatorRow = {
      kind,
      commit,
      armed,
      path,
      source,
      operator_post: operatorPost,
      ticket_id: ticket,
    };
    if (kind === "speech") row.text = text;
    if (kind === "pixels") row.stem = stem;
    const next = [...currentLog(), row];
    setActuatorText(JSON.stringify(next, null, 2));
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
        Actuator span
      </h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        kinds v0: pixels · speech. Arm without a stem is not pixels. path=hold is
        not speech.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Kind">
          <select
            className={selectClass}
            value={kind}
            onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Path">
          <select
            className={selectClass}
            value={path}
            onChange={(e) => setPath(e.target.value as (typeof PATHS)[number])}
          >
            {PATHS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <select
            className={selectClass}
            value={source}
            onChange={(e) => setSource(e.target.value as (typeof SOURCES)[number])}
          >
            {SOURCES.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {kind === "speech" ? (
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="speech-text">Text</Label>
            <Input
              id="speech-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        ) : (
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="stem">Foundry stem</Label>
            <Input
              id="stem"
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="ticket">Ticket id</Label>
          <Input
            id="ticket"
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={commit}
            onChange={(e) => setCommit(e.target.checked)}
          />
          Commit
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={armed}
            onChange={(e) => setArmed(e.target.checked)}
          />
          Armed
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={operatorPost}
            onChange={(e) => setOperatorPost(e.target.checked)}
          />
          Operator post
        </label>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="mt-3 rounded-md"
        onClick={addSpan}
      >
        Append span
      </Button>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const selectClass =
  "flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
