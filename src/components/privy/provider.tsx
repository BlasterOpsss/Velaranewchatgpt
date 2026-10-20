import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { IS_DEVNET, RPC_URL } from "@/lib/velara/network";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";

type Phase = "booting" | "ready" | "unconfigured";

const WalletEnv = createContext<Phase>("booting");

export function useWalletEnv() {
  return useContext(WalletEnv);
}

function privyConfig() {
  return {
    // Devnet test mode only: give Privy a devnet RPC so wallets can sign and send there.
    ...(IS_DEVNET
      ? {
          solana: {
            rpcs: {
              "solana:devnet": {
                rpc: createSolanaRpc(RPC_URL),
                rpcSubscriptions: createSolanaRpcSubscriptions("wss://api.devnet.solana.com"),
              },
            },
          },
        }
      : {}),
    appearance: {
      theme: "dark" as const,
      accentColor: "#E9EBEF" as const,
      walletChainType: "solana-only" as const,
      showWalletLoginFirst: true,
    },
    loginMethods: ["wallet", "email"] as Array<"wallet" | "email">,
    embeddedWallets: {
      solana: {
        createOnLogin: "users-without-wallets" as const,
      },
    },
    externalWallets: {
      solana: {
        connectors: toSolanaWalletConnectors({ shouldAutoConnect: false }),
      },
    },
  };
}

function ReadyPrivy({ children }: { children: ReactNode }) {
  const config = useMemo(() => privyConfig(), []);
  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={config}>
      {children}
    </PrivyProvider>
  );
}

export function VelaraPrivy({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const phase: Phase = !mounted ? "booting" : PRIVY_APP_ID ? "ready" : "unconfigured";
  const tree = <WalletEnv.Provider value={phase}>{children}</WalletEnv.Provider>;
  if (phase !== "ready") return tree;
  return <ReadyPrivy>{tree}</ReadyPrivy>;
}
