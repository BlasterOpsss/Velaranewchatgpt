/**
 * Real private SOL via the Privacy Cash SDK (mainnet only, beta).
 * Everything here runs in the browser and is imported lazily, so it never loads on the server.
 *
 * Package: privacycash@1.3.1 (github.com/Privacy-Cash/privacy-cash-sdk)
 * Circuit files must be served from /circuit2/transaction2.wasm and .zkey (see public/circuit2).
 */
import type { VersionedTransaction } from "@solana/web3.js";
import { RPC_URL } from "@/lib/velara/network";

export type SignMessage = (message: Uint8Array) => Promise<Uint8Array>;
export type SignTransaction = (tx: VersionedTransaction) => Promise<VersionedTransaction>;

const KEY_BASE_PATH = "/circuit2/transaction2";
/** Must match the SDK exactly, or the private balance can never be decrypted again. */
const SDK_SIGN_MESSAGE = "Privacy Money account sign in";
export const LAMPORTS_PER_SOL = 1_000_000_000;

type Sdk = typeof import("privacycash/utils");
let loaded: Promise<{ sdk: Sdk; lightWasm: unknown; web3: typeof import("@solana/web3.js") }> | null = null;

function load() {
  if (!loaded) {
    loaded = (async () => {
      // The SDK expects Node globals; provide them before it loads.
      const { Buffer } = await import("buffer");
      const g = globalThis as unknown as Record<string, unknown>;
      g.Buffer ??= Buffer;
      g.process ??= { env: {}, browser: true, version: "", nextTick: (fn: () => void) => queueMicrotask(fn) };
      const [sdk, hasher, web3] = await Promise.all([
        import("privacycash/utils"),
        import("@lightprotocol/hasher.rs"),
        import("@solana/web3.js"),
      ]);
      const lightWasm = await hasher.WasmFactory.getInstance();
      return { sdk, lightWasm, web3 };
    })();
    loaded.catch(() => {
      loaded = null;
    });
  }
  return loaded;
}

const sessions = new Map<string, unknown>();

/** Ask the wallet to sign the fixed message and derive the encryption key. Same wallet → same key. */
export async function unlock(address: string, signMessage: SignMessage) {
  const { sdk } = await load();
  const signature = await signMessage(new TextEncoder().encode(SDK_SIGN_MESSAGE));
  if (!(signature instanceof Uint8Array) || signature.byteLength < 31) {
    throw new Error("The wallet did not return a usable signature.");
  }
  const service = new sdk.EncryptionService();
  service.deriveEncryptionKeyFromSignature(signature);
  sessions.set(address, service);
}

export function isUnlocked(address: string) {
  return sessions.has(address);
}

export function lock(address: string) {
  sessions.delete(address);
}

async function ctx(address: string) {
  const { sdk, lightWasm, web3 } = await load();
  const encryptionService = sessions.get(address) as InstanceType<Sdk["EncryptionService"]> | undefined;
  if (!encryptionService) throw new Error("Unlock the private account first.");
  return {
    sdk,
    lightWasm: lightWasm as never,
    encryptionService,
    publicKey: new web3.PublicKey(address),
    connection: new web3.Connection(RPC_URL, "confirmed"),
    web3,
  };
}

/** Private SOL balance in lamports. */
export async function getPrivateSol(address: string): Promise<number> {
  const c = await ctx(address);
  const utxos = await c.sdk.getUtxos({
    publicKey: c.publicKey,
    connection: c.connection,
    encryptionService: c.encryptionService,
    storage: localStorage,
  });
  return c.sdk.getBalanceFromUtxos(utxos).lamports;
}

/** Move SOL from the wallet into the private pool. */
export async function shieldSol(address: string, lamports: number, signTransaction: SignTransaction) {
  const c = await ctx(address);
  return c.sdk.deposit({
    lightWasm: c.lightWasm,
    connection: c.connection,
    amount_in_lamports: lamports,
    keyBasePath: KEY_BASE_PATH,
    publicKey: c.publicKey,
    transactionSigner: signTransaction,
    storage: localStorage,
    encryptionService: c.encryptionService,
  });
}

/** Pay a recipient from the private pool. The recipient cannot be linked to the deposit. */
export async function sendPrivateSol(address: string, recipient: string, lamports: number) {
  const c = await ctx(address);
  return c.sdk.withdraw({
    lightWasm: c.lightWasm,
    connection: c.connection,
    amount_in_lamports: lamports,
    keyBasePath: KEY_BASE_PATH,
    publicKey: c.publicKey,
    storage: localStorage,
    encryptionService: c.encryptionService,
    recipient: new c.web3.PublicKey(recipient),
  });
}

/** Approximate relayer fee for a withdrawal, in lamports. */
export async function estimateWithdrawFee(lamports: number): Promise<number> {
  const { sdk } = await load();
  const [rate, rent] = await Promise.all([sdk.getConfig("withdraw_fee_rate"), sdk.getConfig("withdraw_rent_fee")]);
  return Math.floor(lamports * rate + LAMPORTS_PER_SOL * rent);
}
