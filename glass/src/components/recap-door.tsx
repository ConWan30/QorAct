import { useRef } from "react";
import { FileJson, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/lib/workspace";

export function RecapDoor() {
  const recapRef = useRef<HTMLInputElement>(null);
  const actRef = useRef<HTMLInputElement>(null);
  const recapText = useWorkspace((s) => s.recapText);
  const actuatorText = useWorkspace((s) => s.actuatorText);
  const bind = useWorkspace((s) => s.bind);
  const setRecapText = useWorkspace((s) => s.setRecapText);
  const setActuatorText = useWorkspace((s) => s.setActuatorText);
  const setBind = useWorkspace((s) => s.setBind);
  const issue = useWorkspace((s) => s.issue);
  const issuing = useWorkspace((s) => s.issuing);
  const error = useWorkspace((s) => s.error);

  async function readFile(file: File): Promise<string> {
    return file.text();
  }

  async function onDrop(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const text = await readFile(file);
      const name = file.name.toLowerCase();
      if (name.includes("actuator") || name.endsWith(".actuators.json")) {
        setActuatorText(text);
      } else {
        setRecapText(text);
      }
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
            Recap door
          </h2>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground text-pretty">
            Fail-open issuance from session-recap-1. A clip link is not pixels.
            Producer status is ignored.
          </p>
        </div>
        <FileJson className="mt-1 size-4 text-muted-foreground" strokeWidth={1.6} />
      </div>

      <div
        className="mt-4 rounded-lg border border-dashed border-border bg-background/40 px-3 py-4 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onDrop(e.dataTransfer.files);
        }}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Drop Recap JSON · optional actuators sidecar
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => recapRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Recap
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => actRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Actuators
          </Button>
        </div>
        <input
          ref={recapRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void onDrop(e.target.files)}
        />
        <input
          ref={actRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void f.text().then(setActuatorText);
          }}
        />
      </div>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="recap">session-recap-1</Label>
          <Textarea
            id="recap"
            value={recapText}
            onChange={(e) => setRecapText(e.target.value)}
            spellCheck={false}
            className="min-h-[160px]"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="actuators">media actuator log (optional)</Label>
          <Textarea
            id="actuators"
            value={actuatorText}
            onChange={(e) => setActuatorText(e.target.value)}
            spellCheck={false}
            placeholder='[{"kind":"speech","commit":true,"path":"fast","source":"clutchbot","ticket_id":"t1","text":"..."}]'
            className="min-h-[110px]"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="kas">KAS commitment (hash only)</Label>
          <Input
            id="kas"
            value={bind.kasCommitment}
            onChange={(e) => setBind({ kasCommitment: e.target.value })}
            placeholder="sha256:…"
            className="font-mono text-xs"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="kasv">KAS verdict (ref)</Label>
          <Input
            id="kasv"
            value={bind.kasVerdict}
            onChange={(e) => setBind({ kasVerdict: e.target.value })}
            placeholder="optional"
            className="font-mono text-xs"
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="signer">Gamer signer</Label>
          <Input
            id="signer"
            value={bind.signedBy}
            onChange={(e) => setBind({ signedBy: e.target.value })}
            placeholder="not bridge / operator / qoresence / qortroller / qoract"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ToggleRow
          label="HID bodied on host"
          checked={bind.hidBodiedOnHost}
          onCheckedChange={(v) => setBind({ hidBodiedOnHost: v })}
        />
        <ToggleRow
          label="IVC joined"
          checked={bind.ivcJoined}
          onCheckedChange={(v) => setBind({ ivcJoined: v })}
        />
        <ToggleRow
          label="Sealed"
          checked={bind.sealed}
          onCheckedChange={(v) => setBind({ sealed: v })}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="stamp"
          className="h-11 rounded-md px-6"
          disabled={issuing}
          onClick={() => void issue()}
        >
          {issuing ? "Issuing…" : "Issue draft"}
        </Button>
        <p className="font-mono text-[11px] text-muted-foreground">
          live:false · fail-open · no chain write
        </p>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-mixed">{error}</p>
      ) : null}
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border bg-background/50 px-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
