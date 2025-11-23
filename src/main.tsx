import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SuiClientProvider,
  createNetworkConfig,
  WalletProvider,
} from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import App from "./App.tsx";
import "./styles.css";
import { AppStateProvider } from "./state/AppState.tsx";

const { networkConfig } = createNetworkConfig({
  testnet: { url: "https://fullnode.testnet.sui.io" },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
      <QueryClientProvider client={queryClient}>
        <WalletProvider autoConnect>
          <BrowserRouter>
            <AppStateProvider>
              <App />
            </AppStateProvider>
          </BrowserRouter>
        </WalletProvider>
      </QueryClientProvider>
    </SuiClientProvider>
  </React.StrictMode>,
);
