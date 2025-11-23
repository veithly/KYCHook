import { Transaction } from "@mysten/sui/transactions";
import { fromHEX } from "@mysten/sui/utils";
import { ONCHAIN_IDS } from "../constants";

const encoder = new TextEncoder();

function normalizeHex(value: string): string {
  const prefixed = value.startsWith("0x") ? value : `0x${value}`;
  return prefixed.length % 2 === 0 ? prefixed : `0x0${prefixed.slice(2)}`;
}

function hexToBytes(value: string): Uint8Array {
  return fromHEX(normalizeHex(value));
}

export interface RegisterProviderInput {
  providerId: string;
  metadataUrl: string;
  enclavePubkeyHex: string;
  teeMeasurementHex: string;
}

export function buildRegisterProviderTx(input: RegisterProviderInput): string {
  const tx = new Transaction();
  tx.moveCall({
    target: `${ONCHAIN_IDS.packageId}::provider_registry::register_provider`,
    arguments: [
      tx.object(ONCHAIN_IDS.providerRegistryId),
      tx.pure(encoder.encode(input.providerId)),
      tx.pure(hexToBytes(input.enclavePubkeyHex)),
      tx.pure(hexToBytes(input.teeMeasurementHex)),
      tx.pure(encoder.encode(input.metadataUrl)),
    ],
  });
  return tx.serialize();
}

export interface SetProviderActiveInput {
  providerId: string;
  isActive: boolean;
}

export function buildSetProviderActiveTx(input: SetProviderActiveInput): string {
  const tx = new Transaction();
  tx.moveCall({
    target: `${ONCHAIN_IDS.packageId}::provider_registry::set_provider_active`,
    arguments: [
      tx.object(ONCHAIN_IDS.providerRegistryId),
      tx.pure(encoder.encode(input.providerId)),
      tx.pure.bool(input.isActive),
    ],
  });
  return tx.serialize();
}
