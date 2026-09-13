/** Stranger verify. Recompute commitments. Ignore producer status. */

import {
  FORBIDDEN_SIGNERS,
  type QorActRecord,
} from "./record";

export function canonicalJson(payload: unknown): string {
  const sorted = sortKeys(payload);
  const raw = JSON.stringify(sorted);
  return ensureAscii(raw);
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) {
    out[k] = sortKeys(obj[k]);
  }
  return out;
}

function ensureAscii(s: string): string {
  return s.replace(/[\u007f-\uffff]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return "\\u" + code.toString(16).padStart(4, "0");
  });
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes.buffer as ArrayBuffer,
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function clockCommitment(
  payload: unknown,
): Promise<string | null> {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const body = { ...(payload as Record<string, unknown>) };
  delete body.status;
  delete body.producer_status;
  const hex = await sha256Hex(canonicalJson(body));
  return "sha256:" + hex;
}

export type VerifyResult = { ok: boolean; reasons: string[] };

export async function verifyQoract(
  record: QorActRecord,
  opts: {
    recapPayload?: unknown;
    expectedKasCommitment?: string | null;
    signedBy?: string | null;
  } = {},
): Promise<VerifyResult> {
  const reasons: string[] = [];
  if (record.schema !== "qoract-record-1") {
    reasons.push("unknown schema");
  }

  if (opts.recapPayload !== undefined) {
    const recomputed = await clockCommitment(opts.recapPayload);
    if (!record.clock_commitment || record.clock_commitment !== recomputed) {
      reasons.push("clock_commitment does not recompute");
    }
  }

  if (opts.expectedKasCommitment) {
    const got = record.outcome?.kas_commitment ?? null;
    if (got !== opts.expectedKasCommitment) {
      reasons.push("kas_commitment reference mismatch");
    }
  }

  if (record.sealed) {
    const signer = (opts.signedBy ?? "").trim().toLowerCase();
    if (!signer) {
      reasons.push("sealed record missing gamer signer");
    } else if (FORBIDDEN_SIGNERS.has(signer)) {
      reasons.push("forbidden signer");
    }
    if (!record.session_id) {
      reasons.push("sealed record missing session_id");
    }
  }

  if (record.live) {
    reasons.push("live:true is not issued by this candidate");
  }

  return { ok: reasons.length === 0, reasons };
}

