import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useConnectWallet,
  useCurrentAccount,
  useDisconnectWallet,
  useSuiClient,
  useSignAndExecuteTransaction,
  useWallets,
} from "@mysten/dapp-kit";
import type { WalrusDataInput } from "../lib/walrus";
import {
  uploadWalrusDocument,
  requestNautilusProof,
  buildIssueKycTransaction,
  type WalrusUploadResult,
  type NautilusProofArtifacts,
} from "../services/kycWorkflow";
import { DEFAULT_BADGE_ART } from "../constants";
import { fetchOnchainKycStatus, type DevInspectClient } from "../services/onchainStatus";

export type KycStage =
  | "not_started"
  | "collecting"
  | "review"
  | "pending"
  | "approved"
  | "rejected"
  | "onchain";

export type OnchainStatus = "idle" | "submitting" | "verified" | "failed";

export interface KycFormData {
  fullName: string;
  email: string;
  country: string;
  idType: string;
  idNumber: string;
  pep: boolean;
  sanctioned: boolean;
  documentCid: string;
  cardArtCid: string;
}

interface WalletState {
  connected: boolean;
  address?: string;
  label?: string;
  network?: string;
}

interface KycState {
  stage: KycStage;
  level: "L1" | "L2";
  lastUpdated?: string;
  reviewNotes?: string;
  form: KycFormData;
}

interface OnchainState {
  status: OnchainStatus;
  txHash?: string;
  error?: string;
}

interface ModalState {
  title: string;
  message: string;
}

interface AppStateValue {
  wallet: WalletState;
  kyc: KycState;
  onchain: OnchainState;
  modal: ModalState | null;
  walrusArtifact: WalrusUploadResult | null;
  proofArtifact: NautilusProofArtifacts | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  startKyc: () => void;
  updateKycForm: (updates: Partial<KycFormData>) => void;
  markFormReady: () => void;
  submitForReview: () => Promise<void>;
  resetKyc: (options?: { keepWallet?: boolean }) => void;
  uploadDocument: (input: WalrusDataInput) => Promise<void>;
  requestProof: () => Promise<void>;
  pushProofOnChain: () => void;
  markOnchainViewed: () => void;
  dismissModal: () => void;
}

const initialForm: KycFormData = {
  fullName: "",
  email: "",
  country: "United States",
  idType: "Passport",
  idNumber: "",
  pep: false,
  sanctioned: false,
  documentCid: "",
  cardArtCid: DEFAULT_BADGE_ART.cid,
};

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const suiClient = useSuiClient();
  const devInspectClient = suiClient as unknown as DevInspectClient;
  const { mutateAsync: connectAsync } = useConnectWallet();
  const { mutateAsync: disconnectAsync } = useDisconnectWallet();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const wallet: WalletState = useMemo(
    () => ({
      connected: Boolean(currentAccount),
      address: currentAccount?.address,
      label: currentAccount?.label,
      network: currentAccount ? currentAccount.chains?.[0] ?? "testnet" : undefined,
    }),
    [currentAccount],
  );

  const [kyc, setKyc] = useState<KycState>({
    stage: "not_started",
    level: "L1",
    form: initialForm,
  });
  const [onchain, setOnchain] = useState<OnchainState>({ status: "idle" });

  const [walrusArtifact, setWalrusArtifact] = useState<WalrusUploadResult | null>(null);
  const [proofArtifact, setProofArtifact] = useState<NautilusProofArtifacts | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  const connectWallet = useCallback(() => {
    if (wallet.connected) return;
    const targetWallet = wallets[0];
    if (!targetWallet) {
      console.warn("No wallets detected for connection.");
      return;
    }
    void connectAsync({ wallet: targetWallet });
  }, [connectAsync, wallet.connected, wallets]);

  const disconnectWallet = useCallback(() => {
    void disconnectAsync();
    setKyc({ stage: "not_started", level: "L1", form: initialForm });
    setOnchain({ status: "idle" });
    setWalrusArtifact(null);
    setProofArtifact(null);
    setModal(null);
  }, [disconnectAsync]);

  const startKyc = useCallback(() => {
    setKyc((prev) => ({ ...prev, stage: "collecting" }));
  }, []);

  const updateKycForm = useCallback((updates: Partial<KycFormData>) => {
    setKyc((prev) => ({ ...prev, form: { ...prev.form, ...updates } }));
  }, []);

  const markFormReady = useCallback(() => {
    setKyc((prev) => ({ ...prev, stage: "review" }));
  }, []);

  const uploadDocument = useCallback(
    async (input: WalrusDataInput) => {
      setKyc((prev) => ({
        ...prev,
        reviewNotes: "Uploading document to Walrus...",
      }));
      try {
        const artifact = await uploadWalrusDocument(input);
        setWalrusArtifact(artifact);
        setKyc((prev) => ({
          ...prev,
          reviewNotes: "Walrus upload complete. Ready to request Nautilus proof.",
          form: {
            ...prev.form,
            documentCid: artifact.blobObjectId ?? artifact.blobId,
          },
          lastUpdated: new Date().toISOString(),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Walrus upload failed";
        setWalrusArtifact(null);
        setKyc((prev) => ({ ...prev, reviewNotes: message }));
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [],
  );

  const requestProof = useCallback(async () => {
    if (!wallet.address) {
      throw new Error("Connect wallet before requesting proof");
    }
    if (!walrusArtifact) {
      throw new Error("Upload Walrus document first");
    }
    setKyc((prev) => ({
      ...prev,
      stage: "pending",
      reviewNotes: "Requesting Nautilus proof...",
    }));
    try {
      const result = await requestNautilusProof({
        walletAddress: wallet.address,
        level: kyc.level === "L2" ? 2 : 1,
        pep: kyc.form.pep,
        sanctioned: kyc.form.sanctioned,
        blobId: walrusArtifact.blobId,
        blobObjectId: walrusArtifact.blobObjectId,
        docHash: walrusArtifact.docHash,
        nationality: kyc.form.country,
        cardArtCid: kyc.form.cardArtCid,
      });
      setProofArtifact(result);
      setKyc((prev) => ({
        ...prev,
        stage: "approved",
        lastUpdated: new Date().toISOString(),
        reviewNotes: "Proof ready. Submit on-chain to finalize.",
      }));
    } catch (error) {
      const isNautilusDown = error instanceof Error && error.name === "NautilusUnavailable";
      const message = isNautilusDown
        ? "Nautilus backend unreachable. Please resubmit."
        : error instanceof Error
          ? error.message
          : "Nautilus proof failed";
      if (isNautilusDown) {
        setModal({
          title: "KYC verification failed",
          message: "Nautilus service is unavailable. Please resubmit your KYC request.",
        });
      }
      setProofArtifact(null);
      setKyc((prev) => ({ ...prev, reviewNotes: message, stage: "rejected" }));
      throw error instanceof Error ? error : new Error(message);
    }
  }, [kyc.form.pep, kyc.form.sanctioned, kyc.level, wallet.address, walrusArtifact]);

  const submitForReview = useCallback(async () => {
    await requestProof();
  }, [requestProof]);

  const pushProofOnChain = useCallback(async () => {
    if (!proofArtifact?.proofHex) {
      throw new Error("Generate Nautilus proof before submitting on-chain");
    }
    setOnchain({ status: "submitting" });
    try {
      const serialized = buildIssueKycTransaction(proofArtifact.proofHex);
      const result = await signAndExecuteTransaction({ transaction: serialized });
      setOnchain({ status: "verified", txHash: result.digest });
      setKyc((prev) => ({
        ...prev,
        stage: "onchain",
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      setOnchain({ status: "failed", error: message });
    }
  }, [proofArtifact?.proofHex, signAndExecuteTransaction]);

  const resetKyc = useCallback((options?: { keepWallet?: boolean }) => {
    setKyc({ stage: "not_started", level: "L1", form: initialForm });
    setOnchain({ status: "idle" });
    setWalrusArtifact(null);
    setProofArtifact(null);
    setModal(null);
    if (!options?.keepWallet) {
      void disconnectAsync();
    }
  }, [disconnectAsync]);

  useEffect(() => {
    if (!wallet.address) return;

    let cancelled = false;

    const syncOnchainStatus = async () => {
      try {
        const status = await fetchOnchainKycStatus(devInspectClient, wallet.address ?? "");
        if (cancelled || !status) return;

        setKyc((prev) => ({
          ...prev,
          stage: "onchain",
          level: status.kycLevel >= 2 ? "L2" : "L1",
          lastUpdated: status.issuedAt,
        }));
        setOnchain((prev) => ({
          ...prev,
          status: "verified",
        }));
      } catch (error) {
        console.warn("Failed to sync on-chain KYC status", error);
      }
    };

    void syncOnchainStatus();

    return () => {
      cancelled = true;
    };
  }, [devInspectClient, wallet.address]);

  const markOnchainViewed = useCallback(() => {
    setOnchain((prev) => ({ ...prev }));
  }, []);

  const dismissModal = useCallback(() => setModal(null), []);

  const value = useMemo<AppStateValue>(
    () => ({
      wallet,
      kyc,
      onchain,
      modal,
      walrusArtifact,
      proofArtifact,
      connectWallet,
      disconnectWallet,
      startKyc,
      updateKycForm,
      markFormReady,
      submitForReview,
      resetKyc,
      uploadDocument,
      requestProof,
      pushProofOnChain,
      markOnchainViewed,
      dismissModal,
    }),
    [
      wallet,
      kyc,
      onchain,
      modal,
      walrusArtifact,
      proofArtifact,
      connectWallet,
      disconnectWallet,
      startKyc,
      updateKycForm,
      markFormReady,
      submitForReview,
      resetKyc,
      uploadDocument,
      requestProof,
      pushProofOnChain,
      markOnchainViewed,
      dismissModal,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
}
