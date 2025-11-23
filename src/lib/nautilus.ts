import { bcs } from "@mysten/sui/bcs";

type ByteLike = Uint8Array | ArrayBuffer | string;

type BufferLikeInstance = Uint8Array & { toString: (encoding: string) => string };
type BufferLikeConstructor = {
  from(input: string | Uint8Array, encoding?: string): BufferLikeInstance;
};
type GlobalWithBuffer = typeof globalThis & {
  Buffer?: BufferLikeConstructor;
};

export const KYC_INTENT_CODE = 0;

export interface NautilusClientConfig {
  baseUrl: string;
  fetchFn?: typeof fetch;
}

export interface NautilusProcessRequest<TPayload> {
  payload: TPayload;
}

export interface NautilusProcessResponse<TPayload> {
  response: {
    intent: number;
    timestamp_ms: number;
    data: TPayload;
  };
  signature: string;
}

export interface KycRequestPayload {
  userWallet: string;
  providerId: string;
  kycLevel: number;
  isPep: boolean;
  isSanctioned: boolean;
  blobId: string;
  docHash: string;
  walrusCid: string;
  nationality: string;
  cardArtCid: string;
  imageUrl: string;
}

export interface KycResponsePayload extends KycRequestPayload {
  teeMeasurement: string;
}

export interface NautilusKycProof {
  response: NautilusProcessResponse<KycResponsePayload>["response"];
  signature: Uint8Array;
}

export interface NautilusClient {
  health(): Promise<Record<string, unknown>>;
  getAttestation(): Promise<unknown>;
  processKyc(
    payload: NautilusProcessRequest<KycRequestPayload>,
  ): Promise<NautilusProcessResponse<KycResponsePayload>>;
}

const kycDataBcs = bcs.struct("KycResponseData", {
  user_wallet: bcs.Address,
  provider_id: bcs.string(),
  kyc_level: bcs.u8(),
  is_pep: bcs.bool(),
  is_sanctioned: bcs.bool(),
  blob_id: bcs.string(),
  doc_hash: bcs.vector(bcs.u8()),
  walrus_cid: bcs.string(),
  nationality: bcs.string(),
  card_art_cid: bcs.string(),
  image_url: bcs.string(),
  tee_measurement: bcs.vector(bcs.u8()),
});

const nautilusResponseBcs = bcs.struct("NautilusResponse", {
  intent: bcs.u32(),
  timestamp_ms: bcs.u64(),
  data: kycDataBcs,
});

const nautilusProofBcs = bcs.struct("NautilusKycProof", {
  response: nautilusResponseBcs,
  signature: bcs.vector(bcs.u8()),
});

export function createNautilusClient(config: NautilusClientConfig): NautilusClient {
  const fetchImpl = config.fetchFn ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("No fetch implementation available");
  }
  const baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`;

  async function get<T>(path: string): Promise<T> {
    const resp = await fetchImpl(`${baseUrl}${path}`);
    if (!resp.ok) {
      throw new Error(`Nautilus GET ${path} failed with ${resp.status}`);
    }
    return resp.json() as Promise<T>;
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    const resp = await fetchImpl(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      throw new Error(`Nautilus POST ${path} failed with ${resp.status}`);
    }
    return resp.json() as Promise<T>;
  }

  return {
    health: () => get("health_check"),
    getAttestation: () => get("get_attestation"),
    processKyc: (payload) => post("process_data", payload),
  };
}

export function buildKycProofFromResponse(
  result: NautilusProcessResponse<KycResponsePayload>,
): NautilusKycProof {
  return {
    response: result.response,
    signature: hexToBytes(result.signature),
  };
}

export function serializeKycProof(proof: NautilusKycProof): Uint8Array {
  return nautilusProofBcs
    .serialize({
      response: {
        intent: proof.response.intent,
        timestamp_ms: BigInt(proof.response.timestamp_ms),
        data: {
          user_wallet: normalizeAddress(proof.response.data.userWallet),
          provider_id: proof.response.data.providerId,
          kyc_level: proof.response.data.kycLevel,
          is_pep: proof.response.data.isPep,
          is_sanctioned: proof.response.data.isSanctioned,
          blob_id: proof.response.data.blobId,
          doc_hash: hexToBytes(proof.response.data.docHash),
          walrus_cid: proof.response.data.walrusCid,
          nationality: proof.response.data.nationality,
          card_art_cid: proof.response.data.cardArtCid,
          image_url: proof.response.data.imageUrl,
          tee_measurement: hexToBytes(proof.response.data.teeMeasurement),
        },
      },
      signature: proof.signature,
    })
    .toBytes();
}

export function deserializeKycProof(bytes: Uint8Array | ArrayBuffer | string): NautilusKycProof {
  const input = typeof bytes === "string" ? hexToBytes(bytes) : new Uint8Array(bytes);
  const parsed = nautilusProofBcs.parse(input) as unknown as {
    response: {
      intent: number;
      timestamp_ms: bigint;
        data: {
          user_wallet: string;
          provider_id: string;
          kyc_level: number;
          is_pep: boolean;
          is_sanctioned: boolean;
          blob_id: string;
          doc_hash: number[];
          walrus_cid: string;
          nationality: string;
          card_art_cid: string;
          image_url: string;
          tee_measurement: number[];
        };
    };
    signature: number[];
  };
  return {
    response: {
      intent: parsed.response.intent,
      timestamp_ms: Number(parsed.response.timestamp_ms),
      data: {
        userWallet: parsed.response.data.user_wallet,
        providerId: parsed.response.data.provider_id,
        kycLevel: parsed.response.data.kyc_level,
        isPep: parsed.response.data.is_pep,
        isSanctioned: parsed.response.data.is_sanctioned,
        blobId: parsed.response.data.blob_id,
        docHash: bytesToHex(new Uint8Array(parsed.response.data.doc_hash)),
        walrusCid: parsed.response.data.walrus_cid,
        nationality: parsed.response.data.nationality,
        cardArtCid: parsed.response.data.card_art_cid,
        imageUrl: parsed.response.data.image_url,
        teeMeasurement: bytesToHex(new Uint8Array(parsed.response.data.tee_measurement)),
      },
    },
    signature: new Uint8Array(parsed.signature),
  };
}

export function encodeKycProofForMove(proof: NautilusKycProof): string {
  return bytesToHex(serializeKycProof(proof));
}

export function normalizeBytes(value: ByteLike): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") return hexToBytes(value);
  return new Uint8Array(value);
}

export function normalizeAddress(address: string): string {
  return address.startsWith("0x") ? address : `0x${address}`;
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error("Hex string length must be even");
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function toBase64Url(bytes: Uint8Array): string {
  const base64 = encodeBase64(bytes);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

export function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return decodeBase64(padded);
}

function encodeBase64(bytes: Uint8Array): string {
  if (typeof globalThis.btoa === "function") {
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return globalThis.btoa(binary);
  }
  const bufferCtor = (globalThis as GlobalWithBuffer).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(bytes).toString("base64");
  }
  throw new Error("No base64 encoder available");
}

function decodeBase64(value: string): Uint8Array {
  if (typeof globalThis.atob === "function") {
    const binary = globalThis.atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  const bufferCtor = (globalThis as GlobalWithBuffer).Buffer;
  if (bufferCtor) {
    const buffer = bufferCtor.from(value, "base64");
    return new Uint8Array(buffer);
  }
  throw new Error("No base64 decoder available");
}

