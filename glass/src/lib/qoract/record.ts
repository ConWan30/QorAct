/** Frozen record types. Closed enums. No inference helpers here. */

export const SCHEMA = "qoract-record-1";
export const OUTCOME_AGENT = "undeployed";

export const Verdict = {
  HUMAN_AUTHORED: "HUMAN_AUTHORED",
  AGENT_AUTHORED: "AGENT_AUTHORED",
  MIXED: "MIXED",
  UNVERIFIABLE: "UNVERIFIABLE",
} as const;
export type Verdict = (typeof Verdict)[keyof typeof Verdict];

export const Rollup = {
  COMPLETE: "COMPLETE",
  PARTIAL_SURFACES: "PARTIAL_SURFACES",
  UNVERIFIABLE: "UNVERIFIABLE",
} as const;
export type Rollup = (typeof Rollup)[keyof typeof Rollup];

export const MediaKind = {
  PIXELS: "pixels",
  SPEECH: "speech",
} as const;
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];

export const FORBIDDEN_SIGNERS = new Set([
  "bridge",
  "operator",
  "qoresence",
  "qortroller",
  "qoract",
]);

export type OutcomeSurface = {
  verdict: Verdict;
  agent_actuator: string;
  kas_commitment: string | null;
  kas_verdict: string | null;
  hid_bodied_on_host: boolean;
  ivc_joined: boolean;
};

export type MediaSpan = {
  kind: MediaKind;
  verdict: Verdict;
  commit: boolean;
  armed: boolean;
  path: string;
  source: string;
  ticket_id: string;
  clock_ns: number;
  frame_seq: number | null;
  stem: string | null;
};

export type QorActRecord = {
  schema: string;
  live: boolean;
  sealed: boolean;
  session_id: string | null;
  session_display: string;
  recap_ref: string | null;
  clock_commitment: string | null;
  outcome: OutcomeSurface | null;
  media: MediaSpan[];
  fusion_proof_refs: string[];
  rollup: Rollup;
  hygiene_note: string;
  honesty: Record<string, unknown>;
};

export function recordToDict(rec: QorActRecord): Record<string, unknown> {
  return {
    schema: rec.schema,
    live: rec.live,
    sealed: rec.sealed,
    session_id: rec.session_id,
    session_display: rec.session_display,
    recap_ref: rec.recap_ref,
    clock_commitment: rec.clock_commitment,
    outcome: rec.outcome
      ? {
          verdict: rec.outcome.verdict,
          agent_actuator: rec.outcome.agent_actuator,
          kas_commitment: rec.outcome.kas_commitment,
          kas_verdict: rec.outcome.kas_verdict,
          hid_bodied_on_host: rec.outcome.hid_bodied_on_host,
          ivc_joined: rec.outcome.ivc_joined,
        }
      : null,
    media: rec.media.map((s) => ({
      kind: s.kind,
      verdict: s.verdict,
      commit: s.commit,
      armed: s.armed,
      path: s.path,
      source: s.source,
      ticket_id: s.ticket_id,
      clock_ns: s.clock_ns,
      frame_seq: s.frame_seq,
      stem: s.stem,
    })),
    fusion_proof_refs: [...rec.fusion_proof_refs],
    rollup: rec.rollup,
    hygiene_note: rec.hygiene_note,
    honesty: { ...rec.honesty },
  };
}

export function isVerdict(v: string): v is Verdict {
  return (Object.values(Verdict) as string[]).includes(v);
}

export function isRollup(v: string): v is Rollup {
  return (Object.values(Rollup) as string[]).includes(v);
}

export function isMediaKind(v: string): v is MediaKind {
  return (Object.values(MediaKind) as string[]).includes(v);
}
