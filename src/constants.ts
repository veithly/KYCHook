import type { IconName } from "./components/Icon";

export const NAV_LINKS = [
  { label: "Overview", to: "/" },
  { label: "Dashboard", to: "/app" },
  { label: "Developers", to: "/dev/integrate" },
];

export const VALUE_PROPS: ReadonlyArray<{
  title: string;
  description: string;
  icon: IconName;
}> = [
  {
    title: "Reusable KYC credential",
    description: "One verification, reusable proof across every Sui dApp that integrates KycHook.",
    icon: "shield-check",
  },
  {
    title: "Privacy preserved",
    description: "Walrus + Seal keep raw data encrypted off-chain while only hashes land on-chain.",
    icon: "lock-privacy",
  },
  {
    title: "TEE verifiability",
    description: "Nautilus attestation proves the verification logic ran inside a trusted enclave.",
    icon: "chip-tee",
  },
];

export const KYC_STEPS = [
  { id: "start", label: "Start" },
  { id: "form", label: "Form" },
  { id: "review", label: "Review" },
  { id: "pending", label: "Pending" },
  { id: "onchain", label: "On-chain" },
];

export const DEVELOPER_SNIPPETS = [
  {
    label: "Move",
    code: `public fun assert_level(addr: address, min_level: u8) {
    let has_level = kychook::kyc_registry::has_level(addr, min_level);
    assert!(has_level, 0);
}`,
  },
  {
    label: "TypeScript",
    code: `import { getKycStatus } from "@kychook/sdk";

const status = await getKycStatus(provider, wallet);
if (!status?.onChainVerified) {
  throw new Error("KYC required");
}`,
  },
];

export const PROVIDER_METADATA = {
  providerId: "kychook_provider_dev",
  enclavePubkey: "0x8cb7...0011",
  teeMeasurement: "0x5e3b1a9cf2740b8d6f92c3a4b5e6d7c8f9a0b1c2d3e4f5061728394a5b6c7d8f",
  docHash: "0xa92ffbe12ec9c6",
  blobId: "M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk",
  walrusCid: "bafybeid5xzzkychookdemo",
  registryAddress: "0xabc123...def",
};

export { ONCHAIN_IDS } from "./config/onchain";

export type BadgeArtPreset = {
  id: string;
  label: string;
  description: string;
  cid: string;
  gradient: string;
  accent: string;
};

export const BADGE_ART_LIBRARY: BadgeArtPreset[] = [
  {
    id: "aurora",
    label: "Aurora mesh",
    description: "High-contrast blues for fintech experiences.",
    cid: "https://s2.loli.net/2025/11/23/6tK5GvgUham1HNZ.png", // Walrus blobId (svg)
    gradient: "linear-gradient(135deg, #1f95ff, #6f6bff)",
    accent: "rgba(255,255,255,0.25)",
  },
  {
    id: "sunset",
    label: "Sunset dune",
    description: "Warm glow used in DeFi passports.",
    cid: "https://s2.loli.net/2025/11/23/Oub27rhnMCdYRyl.png", // Walrus blobId (svg)
    gradient: "linear-gradient(135deg, #ff8f70, #ff3d54 70%)",
    accent: "rgba(255,255,255,0.18)",
  },
  {
    id: "cyber",
    label: "Cyber lilac",
    description: "Neon mesh for gaming guilds.",
    cid: "https://s2.loli.net/2025/11/23/JD2yz8t1gf3KmnW.png", // Walrus blobId (svg)
    gradient: "linear-gradient(135deg, #8d4eff, #38d1ff)",
    accent: "rgba(255,255,255,0.22)",
  },
];

export const DEFAULT_BADGE_ART = BADGE_ART_LIBRARY[0];
