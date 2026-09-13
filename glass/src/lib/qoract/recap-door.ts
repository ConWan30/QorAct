/** Q-ACT-2 Recap door â€” fail-open issuance from session-recap-1. */

import { buildQoract, type MediaActuatorRow } from "./build";
import { SCHEMA, type QorActRecord } from "./record";
import { clockCommitment } from "./verify";

function sessionId(payload: Record<string, unknown>): string | null {
  for (const key of ["session_id", "session"] as const) {
    let raw: unknown = payload[key];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const obj = raw as Record<string, unknown>;
      raw = obj.id ?? obj.session_id;
    }
    const text = String(raw ?? "").trim();
    if (text && text !== "[object Object]") return text;
  }
  return null;
}

function sessionDisplay(payload: Record<string, unknown>): string {
  const shown = payload.session_display ?? payload.session;
  if (shown === null || shown === undefined) return "";
  if (typeof shown === "object") {
    const obj = shown as Record<string, unknown>;
    return String(obj.id ?? obj.session_id ?? "").trim();
  }
  return String(shown);
}

function linkedStems(payload: Record<string, unknown>): string[] {
  const stems: string[] = [];
  const events = payload.events;
  if (!Array.isArray(events)) return stems;
  for (const ev of events) {
    if (!ev || typeof ev !== "object" || Array.isArray(ev)) continue;
    const clip = (ev as Record<string, unknown>).clip;
    if (!clip || typeof clip !== "object" || Array.isArray(clip)) continue;
    const c = clip as Record<string, unknown>;
    if (!c.available) continue;
    const stem = String(c.clip_id ?? c.stem ?? "").trim();
    if (stem.startsWith("hdmi_clip_")) stems.push(stem);
  }
  return stems;
}

export type IssueArgs = {
  mediaActuatorLog?: MediaActuatorRow[] | null;
  kasCommitment?: string | null;
  kasVerdict?: string | null;
  fusionProofRefs?: string[] | null;
  hidBodiedOnHost?: boolean;
  ivcJoined?: boolean;
  sealed?: boolean;
  signedBy?: string | null;
  hygieneNote?: string;
  sidecarUsed?: boolean;
};

export async function issueFromRecap(
  recapPayload: unknown,
  args: IssueArgs = {},
): Promise<QorActRecord> {
  try {
    if (
      recapPayload === null ||
      typeof recapPayload !== "object" ||
      Array.isArray(recapPayload)
    ) {
      const rec = await buildQoract({
        sessionId: null,
        hygieneNote: "recap payload is not an object",
      });
      rec.honesty.sidecar_used = Boolean(args.sidecarUsed);
      return rec;
    }
    const payload = recapPayload as Record<string, unknown>;
    const schema = String(payload.schema ?? payload.schema_version ?? "");
    let note = args.hygieneNote ?? "";
    if (schema !== "session-recap-1") {
      const shown = schema || "missing";
      note = (note + ` unexpected recap schema ${shown}`).trim();
    }
    const stems = linkedStems(payload);
    if (stems.length && !args.mediaActuatorLog) {
      note = (
        note +
        ` ${stems.length} linked clip(s) present; initiator unknown so no pixels verdict`
      ).trim();
    }
    const rec = await buildQoract({
      sessionId: sessionId(payload),
      sessionDisplay: sessionDisplay(payload),
      recapPayload: payload,
      recapRef: await clockCommitment(payload),
      kasCommitment: args.kasCommitment,
      kasVerdict: args.kasVerdict,
      fusionProofRefs: args.fusionProofRefs,
      mediaActuatorLog: args.mediaActuatorLog,
      hidBodiedOnHost: args.hidBodiedOnHost,
      ivcJoined: args.ivcJoined,
      sealed: args.sealed,
      signedBy: args.signedBy,
      producerStatus: String(payload.status ?? ""),
      hygieneNote: note,
    });
    rec.honesty.sidecar_used = Boolean(args.sidecarUsed);
    return rec;
  } catch (exc) {
    const name = exc instanceof Error ? exc.constructor.name : "Error";
    const rec = await buildQoract({
      sessionId: null,
      hygieneNote: `recap door fail-open: ${name}`,
    });
    rec.honesty.sidecar_used = Boolean(args.sidecarUsed);
    return rec;
  }
}

export function recapDoorHealth(rec: QorActRecord): Record<string, unknown> {
  return {
    schema: rec.schema === SCHEMA ? rec.schema : "unknown",
    live: rec.live,
    sealed: rec.sealed,
    rollup: rec.rollup,
    outcome: rec.outcome ? rec.outcome.verdict : null,
    media_spans: rec.media.length,
    issued: rec.schema === SCHEMA,
    fail_open: true,
    humanity_claim: false,
    sidecar_used: Boolean(rec.honesty.sidecar_used),
  };
}

