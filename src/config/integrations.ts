type IntegrationEnv = "VITE_WALRUS_PUBLISHER_URL" | "VITE_WALRUS_AGGREGATOR_URL" | "VITE_NAUTILUS_BASE_URL";

function requireIntegrationEnv(key: IntegrationEnv): string {
  const value = import.meta.env[key];
  if (!value || typeof value !== "string") {
    throw new Error(`Missing ${key}. Please provide it in .env`);
  }
  return value;
}

export const WALRUS_CONFIG = {
  publisherUrl: requireIntegrationEnv("VITE_WALRUS_PUBLISHER_URL"),
  aggregatorUrl: requireIntegrationEnv("VITE_WALRUS_AGGREGATOR_URL"),
};

export const NAUTILUS_CONFIG = {
  baseUrl: requireIntegrationEnv("VITE_NAUTILUS_BASE_URL").replace(/\/?$/, "/"),
};
