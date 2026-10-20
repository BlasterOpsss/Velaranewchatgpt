export const ASSETS = ["SOL", "USDC", "USDT"] as const;
export type Asset = (typeof ASSETS)[number];

export const TOKEN_CA = "BuEmxw2bVH9hTpDcUoyJR5YRwY5sLwqQyjVXAyv3pump";
export const TOKEN_URL = `https://solscan.io/token/${TOKEN_CA}`;
export const SAMPLE_RECIPIENT = "8yH2nQm4sC7vWp9xR3tK6uXaB5dE1fG2hJ4kM8nP3q";

export function signMessageFor(address: string) {
  return `VELARA

Open the private account for this wallet.
This message does not spend SOL, USDC, or USDT.
It stays in this browser.

${address}`;
}

export const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Choose the wallet that will own this private account.",
  },
  {
    n: "02",
    title: "Sign",
    body: "Approve the fixed message. It does not spend funds.",
  },
  {
    n: "03",
    title: "Move",
    body: "Shield from the wallet, then send to any address.",
  },
] as const;

export type Balances = Record<Asset, number>;

export function seedPublic(): Balances {
  return { SOL: 12.4, USDC: 2500, USDT: 800 };
}

export function emptyBalances(): Balances {
  return { SOL: 0, USDC: 0, USDT: 0 };
}

export function decimals(asset: Asset) {
  return asset === "SOL" ? 4 : 2;
}

export function roundAmount(asset: Asset, amount: number) {
  const factor = 10 ** decimals(asset);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

export function formatAmount(asset: Asset, amount: number) {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals(asset),
  });
}

export function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isAddress(value: string) {
  return BASE58.test(value.trim());
}

export function makeRef() {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let ref = "";
  for (const byte of bytes) ref += alphabet[byte % alphabet.length];
  return ref;
}
