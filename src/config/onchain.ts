type RequiredEnv =
  | "VITE_KYCHOOK_PACKAGE_ID"
  | "VITE_PROVIDER_REGISTRY_ID"
  | "VITE_KYC_REGISTRY_ID"
  | "VITE_KYCHOOK_UPGRADE_CAP";

function requireEnv(key: RequiredEnv): string {
  const value = import.meta.env[key];
  if (!value || typeof value !== "string") {
    throw new Error(`Missing required env variable ${key}`);
  }
  return value;
}

export const ONCHAIN_IDS = {
  packageId: requireEnv("VITE_KYCHOOK_PACKAGE_ID"),
  providerRegistryId: requireEnv("VITE_PROVIDER_REGISTRY_ID"),
  kycRegistryId: requireEnv("VITE_KYC_REGISTRY_ID"),
  upgradeCapId: requireEnv("VITE_KYCHOOK_UPGRADE_CAP"),
};
