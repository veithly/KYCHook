import { fromHEX } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { createWalrusClient, type WalrusDataInput } from "../lib/walrus";
import {
  buildKycProofFromResponse,
  createNautilusClient,
  encodeKycProofForMove,
  type NautilusProcessRequest,
  type NautilusProcessResponse,
  type KycRequestPayload,
  type KycResponsePayload,
  normalizeAddress,
} from "../lib/nautilus";
import { ONCHAIN_IDS, PROVIDER_METADATA } from "../constants";
import { WALRUS_CONFIG, NAUTILUS_CONFIG } from "../config/integrations";

const CLOCK_OBJECT_ID = "0x6";

const walrusClient = createWalrusClient(WALRUS_CONFIG);
const nautilusClient = createNautilusClient({ baseUrl: NAUTILUS_CONFIG.baseUrl });

export interface WalrusUploadResult {
  blobId: string;
  blobObjectId?: string;
  txDigest?: string;
  endEpoch?: number;
  size: number;
  docHash: string;
  payloadHex: string;
}

export interface NautilusProofArtifacts {
  response: NautilusProcessResponse<KycResponsePayload>["response"];
  signature: string;
  proofHex: string;
}

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(view, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function toUint8Array(input: WalrusDataInput): Promise<Uint8Array> {
  if (input instanceof Uint8Array) return input;
  if (typeof input === "string") return new TextEncoder().encode(input);
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return new Uint8Array(await input.arrayBuffer());
  }
  throw new Error("Unsupported Walrus input");
}

export async function uploadWalrusDocument(input: WalrusDataInput): Promise<WalrusUploadResult> {
  const bytes = await toUint8Array(input);
  const walrusResult = await walrusClient.storeBlob(bytes);
  const digestInput =
    bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? bytes.buffer
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const hashBuffer = await crypto.subtle.digest("SHA-256", digestInput as ArrayBuffer);
  const docHash = `0x${toHex(hashBuffer)}`;

  return {
    blobId: walrusResult.blobId,
    blobObjectId: walrusResult.blobObjectId,
    txDigest: walrusResult.txDigest,
    endEpoch: walrusResult.endEpoch,
    size: walrusResult.size,
    docHash,
    payloadHex: `0x${toHex(bytes)}`,
  };
}

export interface NautilusRequestInput {
  walletAddress: string;
  level: number;
  pep: boolean;
  sanctioned: boolean;
  blobId: string;
  blobObjectId?: string;
  docHash: string;
  nationality: string;
  cardArtCid: string;
}

export async function requestNautilusProof(input: NautilusRequestInput): Promise<NautilusProofArtifacts> {
  const isHttpArt = input.cardArtCid.startsWith("http://") || input.cardArtCid.startsWith("https://");
  const imageUrl = isHttpArt
    ? input.cardArtCid
    : `${WALRUS_CONFIG.aggregatorUrl.replace(/\/$/, "")}/v1/blobs/${input.cardArtCid}`;

  try {
    await nautilusClient.health();
  } catch {
    const unavailError = new Error("Nautilus service unavailable");
    unavailError.name = "NautilusUnavailable";
    throw unavailError;
  }

  const payload: NautilusProcessRequest<KycRequestPayload> = {
    payload: {
      userWallet: normalizeAddress(input.walletAddress),
      providerId: PROVIDER_METADATA.providerId,
      kycLevel: input.level,
      isPep: input.pep,
      isSanctioned: input.sanctioned,
      blobId: input.blobId,
      docHash: input.docHash,
      walrusCid: input.blobObjectId ?? input.blobId,
      nationality: input.nationality,
      cardArtCid: input.cardArtCid,
      imageUrl,
    },
  };

  const response = await nautilusClient.processKyc(payload);
  const proof = buildKycProofFromResponse(response);
  const proofHex = encodeKycProofForMove(proof);
  return { response: response.response, signature: response.signature, proofHex };
}

export function buildIssueKycTransaction(receiptHex: string): string {
  if (!receiptHex.startsWith("0x")) {
    throw new Error("Receipt argument must be a hex string prefixed with 0x");
  }
  const receiptBytes = fromHEX(receiptHex);
  const tx = new Transaction();
  tx.moveCall({
    target: `${ONCHAIN_IDS.packageId}::kyc_registry::issue_kyc`,
    arguments: [
      tx.object(ONCHAIN_IDS.kycRegistryId),
      tx.object(ONCHAIN_IDS.providerRegistryId),
      tx.object(CLOCK_OBJECT_ID),
      // Explicitly BCS-encode as vector<u8> to match Move signature; passing raw
      // bytes would skip BCS serialization and trigger InvalidBCSBytes.
      tx.pure.vector("u8", Array.from(receiptBytes)),
    ],
  });
  return tx.serialize();
}
