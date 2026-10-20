export const NETWORK: "mainnet" | "devnet" =
  import.meta.env.VITE_SOLANA_NETWORK === "devnet" ? "devnet" : "mainnet";

export const IS_DEVNET = NETWORK === "devnet";

export const RPC_URL: string =
  import.meta.env.VITE_SOLANA_RPC_URL ||
  (IS_DEVNET ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com");

export const CHAIN_ID = IS_DEVNET ? ("solana:devnet" as const) : ("solana:mainnet" as const);

export const MINTS: Record<"USDC" | "USDT", string> = IS_DEVNET
  ? {
      USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      USDT: "11111111111111111111111111111111",
    }
  : {
      USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    };
