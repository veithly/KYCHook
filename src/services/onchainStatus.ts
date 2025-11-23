import { bcs } from "@mysten/sui/bcs";
import { Transaction } from "@mysten/sui/transactions";
import { fromB64 } from "@mysten/sui/utils";
import { ONCHAIN_IDS } from "../constants";

const textDecoder = new TextDecoder();

function toUint8Array(value: Uint8Array | number[] | string): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") {
    return fromB64(value);
  }
  return new Uint8Array(value);
}

function decodeU64(bytes: Uint8Array): bigint {
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result |= BigInt(bytes[i]) << BigInt(8 * i);
  }
  return result;
}

function toUtf8String(value: Uint8Array | number[] | string): string {
  if (typeof value === "string") {
    return value;
  }
  return textDecoder.decode(toUint8Array(value));
}

const KYC_STATUS_BCS = bcs.struct("KycStatus", {
  kyc_level: bcs.u8(),
  is_pep: bcs.bool(),
  is_sanctioned: bcs.bool(),
  issued_at: bcs.u64(),
  expires_at: bcs.option(bcs.u64()),
  badge_id: bcs.option(bcs.vector(bcs.u8())),
  blob_id: bcs.string(),
  doc_hash: bcs.vector(bcs.u8()),
  walrus_cid: bcs.string(),
  provider_id: bcs.string(),
  nationality: bcs.string(),
  card_art_cid: bcs.string(),
  image_url: bcs.string(),
  tee_measurement: bcs.vector(bcs.u8()),
  version: bcs.u64(),
});

const OPTION_KYC_STATUS = bcs.option(KYC_STATUS_BCS);

type RawKycStatus = {
  kyc_level: number;
  is_pep: boolean;
  is_sanctioned: boolean;
  issued_at: Uint8Array | number[] | string;
  expires_at?: Uint8Array | number[] | string | null;
  badge_id?: Uint8Array | number[] | string | null;
  blob_id: string;
  doc_hash: Uint8Array | number[] | string;
  walrus_cid: Uint8Array | number[] | string;
  provider_id: Uint8Array | number[] | string;
  nationality: string;
  card_art_cid: string;
  image_url: string;
  tee_measurement: Uint8Array | number[] | string;
  version: Uint8Array | number[] | string;
};

export interface OnchainKycStatus {
  kycLevel: number;
  isPep: boolean;
  isSanctioned: boolean;
  issuedAt: string;
  expiresAt?: string;
  blobId: string;
  docHash: string;
  walrusCid: string;
  providerId: string;
  nationality: string;
  cardArtCid: string;
  imageUrl: string;
  teeMeasurement: string;
  version: number;
  badgeId?: string;
}

function bytesToHex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

type DevInspectParams = {
  sender: string;
  transactionBlock: unknown;
};

type DevInspectResult = {
  returnValues?: unknown[][];
}[];

export type DevInspectClient = {
  devInspectTransactionBlock: (input: DevInspectParams) => Promise<{ results?: DevInspectResult }>;
};

export async function fetchOnchainKycStatus(
  client: DevInspectClient,
  userAddress: string,
): Promise<OnchainKycStatus | null> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${ONCHAIN_IDS.packageId}::kyc_registry::get_kyc_status`,
    arguments: [tx.object(ONCHAIN_IDS.kycRegistryId), tx.pure.address(userAddress)],
  });

  const inspect = await client.devInspectTransactionBlock({
    sender: userAddress || "0x0",
    transactionBlock: tx.serialize(),
  });

  const rawReturnValue = inspect.results?.[0]?.returnValues?.[0];
  if (!rawReturnValue) {
    return null;
  }

  const [b64] = rawReturnValue as unknown as [string, string];
  const bytes = fromB64(b64);
  const decoded = OPTION_KYC_STATUS.parse(bytes);

  if (!decoded) {
    return null;
  }

  const statusData = decoded as RawKycStatus;
  const blobId = statusData.blob_id;
  const docHashBytes = toUint8Array(statusData.doc_hash);
  const teeBytes = toUint8Array(statusData.tee_measurement);
  const issuedAt = decodeU64(toUint8Array(statusData.issued_at));
  const versionValue = decodeU64(toUint8Array(statusData.version));
  const expiresBytes = statusData.expires_at ? toUint8Array(statusData.expires_at) : null;
  const expiresAtValue = expiresBytes && expiresBytes.length > 0 ? decodeU64(expiresBytes) : undefined;
  const walrusCid = toUtf8String(statusData.walrus_cid);
  const providerId = toUtf8String(statusData.provider_id);
  const badgeId =
    statusData.badge_id && toUint8Array(statusData.badge_id).length > 0
      ? bytesToHex(toUint8Array(statusData.badge_id))
      : undefined;

  return {
    kycLevel: statusData.kyc_level,
    isPep: statusData.is_pep,
    isSanctioned: statusData.is_sanctioned,
    issuedAt: new Date(Number(issuedAt)).toISOString(),
    expiresAt: expiresAtValue ? new Date(Number(expiresAtValue)).toISOString() : undefined,
    blobId,
    docHash: bytesToHex(docHashBytes),
    walrusCid,
    providerId,
    badgeId,
    nationality: statusData.nationality,
    cardArtCid: statusData.card_art_cid,
    imageUrl: statusData.image_url,
    teeMeasurement: bytesToHex(teeBytes),
    version: Number(versionValue),
  };
}
