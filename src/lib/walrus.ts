import { blake3 } from "@noble/hashes/blake3";

type BufferLikeInstance = Uint8Array & { toString: (encoding: string) => string };
type BufferLikeConstructor = {
  from(input: string | Uint8Array, encoding?: string): BufferLikeInstance;
};

type GlobalWithBuffer = typeof globalThis & {
  Buffer?: BufferLikeConstructor;
};

export type WalrusDataInput = ArrayBuffer | Uint8Array | string | Blob;

export interface WalrusClientConfig {
  publisherUrl: string;
  aggregatorUrl: string;
  defaultEpochs?: number;
  fetchFn?: typeof fetch;
}

export interface StoreBlobOptions {
  epochs?: number;
  permanent?: boolean;
  sendObjectTo?: string;
  signal?: AbortSignal;
  contentType?: string;
}

export interface StoreBlobResult {
  blobId: string;
  status: "new" | "alreadyCertified";
  endEpoch?: number;
  txDigest?: string;
  blobObjectId?: string;
  size: number;
}

export interface WalrusClient {
  storeBlob(input: WalrusDataInput, opts?: StoreBlobOptions): Promise<StoreBlobResult>;
  fetchBlob(blobId: string, signal?: AbortSignal): Promise<Uint8Array>;
  fetchBlobByObjectId(objectId: string, signal?: AbortSignal): Promise<Uint8Array>;
  deriveBlobId(input: WalrusDataInput): Promise<string>;
}

// Walrus API response types based on official documentation
// https://github.com/mystenlabs/walrus/blob/main/docs/book/usage/web-api.md
type PublisherResponse = {
  newlyCreated?: {
    blobObject: {
      id: string;
      registeredEpoch: number;
      blobId: string;
      size: number;
      encodingType: string;
      certifiedEpoch: number | null;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
      deletable: boolean;
    };
    resourceOperation: {
      registerFromScratch?: {
        encodedLength: number;
        epochsAhead: number;
      };
    };
    cost: number;
  };
  alreadyCertified?: {
    blobId: string;
    event: {
      txDigest: string;
      eventSeq: string;
    };
    endEpoch: number;
  };
};

export function createWalrusClient(config: WalrusClientConfig): WalrusClient {
  if (!config.publisherUrl || !config.aggregatorUrl) {
    throw new Error("Walrus requires both publisherUrl and aggregatorUrl");
  }

  const fetchImpl = config.fetchFn ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("No fetch implementation available for WalrusClient");
  }

  const publisher = withTrailingSlash(config.publisherUrl);
  const aggregator = withTrailingSlash(config.aggregatorUrl);

  async function storeBlob(
    input: WalrusDataInput,
    opts?: StoreBlobOptions,
  ): Promise<StoreBlobResult> {
    const body = await normalizeInput(input);
    const payloadBuffer =
      body.byteOffset === 0 && body.byteLength === body.buffer.byteLength
        ? body.buffer
        : body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    const payload = payloadBuffer as ArrayBuffer;
    const epochs = opts?.epochs ?? config.defaultEpochs ?? 1;
    const query = new URLSearchParams();
    query.set("epochs", epochs.toString());
    if (opts?.permanent) {
      query.set("permanent", "true");
    }
    if (opts?.sendObjectTo) {
      query.set("send_object_to", opts.sendObjectTo);
    }

    const response = await fetchImpl(`${publisher}v1/blobs?${query.toString()}`, {
      method: "PUT",
      body: payload,
      signal: opts?.signal,
      headers: {
        "content-type": opts?.contentType ?? "application/octet-stream",
      },
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Walrus publisher error ${response.status}: ${text}`);
    }

    const parsed = safeParsePublisherResponse(text);
    const size = body.byteLength ?? body.length ?? 0;

    if (parsed.newlyCreated) {
      // Extract from correct nested structure: blobObject.blobId, blobObject.storage.endEpoch
      return {
        blobId: parsed.newlyCreated.blobObject.blobId,
        status: "new",
        endEpoch: parsed.newlyCreated.blobObject.storage.endEpoch,
        txDigest: undefined, // newlyCreated response does not include txDigest
        blobObjectId: parsed.newlyCreated.blobObject.id,
        size,
      };
    }

    if (parsed.alreadyCertified) {
      return {
        blobId: parsed.alreadyCertified.blobId,
        status: "alreadyCertified",
        endEpoch: parsed.alreadyCertified.endEpoch,
        txDigest: parsed.alreadyCertified.event.txDigest,
        size,
      };
    }

    throw new Error("Walrus publisher response missing expected fields");
  }

  async function fetchBlob(blobId: string, signal?: AbortSignal): Promise<Uint8Array> {
    const response = await fetchImpl(`${aggregator}v1/blobs/${encodeURIComponent(blobId)}`, {
      signal,
    });
    if (!response.ok) {
      throw new Error(`Walrus aggregator error ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async function fetchBlobByObjectId(
    objectId: string,
    signal?: AbortSignal,
  ): Promise<Uint8Array> {
    const response = await fetchImpl(
      `${aggregator}v1/blobs/by-object-id/${encodeURIComponent(objectId)}`,
      { signal },
    );
    if (!response.ok) {
      throw new Error(`Walrus aggregator error ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async function deriveBlobId(input: WalrusDataInput): Promise<string> {
    const bytes = await normalizeInput(input);
    const digest = blake3(bytes);
    return toBase64Url(digest);
  }

  return { storeBlob, fetchBlob, fetchBlobByObjectId, deriveBlobId };
}

export function blobIdToBytes(id: string): Uint8Array {
  return fromBase64Url(id);
}

async function normalizeInput(input: WalrusDataInput): Promise<Uint8Array> {
  if (input instanceof Uint8Array) {
    return input;
  }
  if (typeof input === "string") {
    return new TextEncoder().encode(input);
  }
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  if (isBlob(input)) {
    return new Uint8Array(await input.arrayBuffer());
  }
  throw new Error("Unsupported Walrus input");
}

function isBlob(value: WalrusDataInput): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function safeParsePublisherResponse(text: string): PublisherResponse {
  try {
    return JSON.parse(text) as PublisherResponse;
  } catch {
    throw new Error("Unable to parse Walrus publisher response");
  }
}

function withTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function toBase64Url(bytes: Uint8Array): string {
  const base64 = base64Encode(bytes);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return base64Decode(padded);
}

function base64Encode(bytes: Uint8Array): string {
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

  throw new Error("No base64 encoder available in this environment");
}

function base64Decode(str: string): Uint8Array {
  if (typeof globalThis.atob === "function") {
    const binary = globalThis.atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  const bufferCtor = (globalThis as GlobalWithBuffer).Buffer;
  if (bufferCtor) {
    const buffer = bufferCtor.from(str, "base64");
    return new Uint8Array(buffer);
  }

  throw new Error("No base64 decoder available in this environment");
}
