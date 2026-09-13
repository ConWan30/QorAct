/** Additive SDK reader. Null-safe. Does not issue. */

import {
  isMediaKind,
  isRollup,
  isVerdict,
  Rollup,
  Verdict,
  type MediaSpan,
  type OutcomeSurface,
  type QorActRecord,
} from "./record";

function asVerdict(v: unknown, fallback: Verdict = Verdict.UNVERIFIABLE): Verdict {
  const text = String(v ?? "");
  return isVerdict(text) ? text : fallback;
}

export function recordFromDict(d: unknown): QorActRecord | null {
  if (d === null || typeof d !== "object" || Array.isArray(d)) return null;
  const obj = d as Record<string, unknown>;
  const media: MediaSpan[] = [];
  const rawMedia = obj.media;
  if (Array.isArray(rawMedia)) {
    for (const s of rawMedia) {
      if (!s || typeof s !== "object" || Array.isArray(s)) continue;
      const row = s as Record<string, unknown>;
      const kindRaw = String(row.kind ?? "");
      if (!isMediaKind(kindRaw)) continue;
      let frameSeq: number | null = null;
      if (row.frame_seq !== undefined && row.frame_seq !== null && row.frame_seq !== "") {
        const n = Number(row.frame_seq);
        frameSeq = Number.isFinite(n) ? n : null;
      }
      media.push({
        kind: kindRaw,
        verdict: asVerdict(row.verdict),
        commit: Boolean(row.commit),
        armed: Boolean(row.armed),
        path: String(row.path ?? ""),
        source: String(row.source ?? ""),
        ticket_id: String(row.ticket_id ?? ""),
        clock_ns: Number.parseInt(String(row.clock_ns ?? 0), 10) || 0,
        frame_seq: frameSeq,
        stem: row.stem == null ? null : String(row.stem),
      });
    }
  }
  let outcome: OutcomeSurface | null = null;
  const out = obj.outcome;
  if (out && typeof out === "object" && !Array.isArray(out)) {
    const o = out as Record<string, unknown>;
    outcome = {
      verdict: asVerdict(o.verdict),
      agent_actuator: String(o.agent_actuator ?? "undeployed"),
      kas_commitment: o.kas_commitment == null ? null : String(o.kas_commitment),
      kas_verdict: o.kas_verdict == null ? null : String(o.kas_verdict),
      hid_bodied_on_host: Boolean(o.hid_bodied_on_host),
      ivc_joined: Boolean(o.ivc_joined),
    };
  }
  const rollupRaw = String(obj.rollup ?? "");
  const rollup = isRollup(rollupRaw) ? rollupRaw : Rollup.UNVERIFIABLE;
  return {
    schema: String(obj.schema ?? ""),
    live: Boolean(obj.live),
    sealed: Boolean(obj.sealed),
    session_id: obj.session_id == null ? null : String(obj.session_id),
    session_display: String(obj.session_display ?? ""),
    recap_ref: obj.recap_ref == null ? null : String(obj.recap_ref),
    clock_commitment:
      obj.clock_commitment == null ? null : String(obj.clock_commitment),
    outcome,
    media,
    fusion_proof_refs: Array.isArray(obj.fusion_proof_refs)
      ? obj.fusion_proof_refs.map((x) => String(x)).filter(Boolean)
      : [],
    rollup,
    hygiene_note: String(obj.hygiene_note ?? ""),
    honesty:
      obj.honesty && typeof obj.honesty === "object" && !Array.isArray(obj.honesty)
        ? { ...(obj.honesty as Record<string, unknown>) }
        : {},
  };
}

