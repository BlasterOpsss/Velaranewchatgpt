import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { useSignMessage, useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { VersionedTransaction } from "@solana/web3.js";
import { useWalletEnv } from "@/components/privy/provider";
import { IS_DEVNET } from "@/lib/velara/network";
import { isAddress, shortAddress } from "@/lib/velara/model";
import {
  LAMPORTS_PER_SOL,
  estimateWithdrawFee,
  getPrivateSol,
  isUnlocked,
  sendPrivateSol,
  shieldSol,
  unlock,
} from "@/lib/velara/privacy";

export const Route = createFileRoute("/private")({
  head: () => ({ meta: [{ title: "Private SOL · VELARA" }] }),
  component: PrivatePage,
});

function toLamports(text: string): number | null {
  const value = Number(text.trim());
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * LAMPORTS_PER_SOL);
}

const sol = (lamports: number) => (lamports / LAMPORTS_PER_SOL).toFixed(6).replace(/0+$/, "").replace(/\.$/, ".0");

function PrivatePage() {
  const phase = useWalletEnv();
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="kicker">Beta · mainnet only</p>
      <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">Private SOL</h1>
      <p className="mt-6 text-sm leading-7 text-mist">
        Real deposits into the Privacy Cash pool, and real private payouts. This moves real SOL. The
        SDK is beta software with no warranty. Start with a small amount from a burner wallet.
      </p>
      {IS_DEVNET ? (
        <p className="mt-8 border border-line p-4 text-sm text-paper">
          Private mode only works on mainnet. Remove VITE_SOLANA_NETWORK=devnet and restart.
        </p>
      ) : phase !== "ready" ? (
        <p className="mt-8 border border-line p-4 text-sm text-paper">Wallet sign-in is not configured.</p>
      ) : (
        <Flow />
      )}
    </section>
  );
}

function Flow() {
  const { authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { signMessage } = useSignMessage();
  const { signTransaction } = useSignTransaction();
  const wallet = wallets[0];
  const address = wallet?.address ?? null;

  const [ready, setReady] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [shieldAmount, setShieldAmount] = useState("");
  const [to, setTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [fee, setFee] = useState<number | null>(null);

  useEffect(() => {
    setReady(address ? isUnlocked(address) : false);
    setBalance(null);
  }, [address]);

  const refresh = useCallback(async () => {
    if (!address) return;
    setBalance(await getPrivateSol(address));
  }, [address]);

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label);
    setError(null);
    setNote(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const onUnlock = () =>
    run("Unlocking…", async () => {
      if (!wallet || !address) return;
      await unlock(address, async (message) => {
        const result = await signMessage({
          message,
          wallet,
          options: { uiOptions: { title: "Open your private account" } },
        });
        return result.signature;
      });
      setReady(true);
      await refresh();
    });

  const onShield = (event: FormEvent) => {
    event.preventDefault();
    const lamports = toLamports(shieldAmount);
    if (!lamports || !address || !wallet) {
      setError("Enter an amount, like 0.01.");
      return;
    }
    void run("Shielding… this can take a minute", async () => {
      await shieldSol(address, lamports, async (tx) => {
        const result = await signTransaction({ transaction: tx.serialize(), wallet });
        return VersionedTransaction.deserialize(result.signedTransaction);
      });
      setShieldAmount("");
      setNote(`Shielded ${sol(lamports)} SOL.`);
      await refresh();
    });
  };

  const onSend = (event: FormEvent) => {
    event.preventDefault();
    const lamports = toLamports(sendAmount);
    if (!lamports || !address) {
      setError("Enter an amount, like 0.01.");
      return;
    }
    if (!isAddress(to.trim())) {
      setError("That is not a valid Solana address.");
      return;
    }
    void run("Proving and sending… this can take a minute", async () => {
      const result = await sendPrivateSol(address, to.trim(), lamports);
      setSendAmount("");
      setNote(`Sent. Transaction ${result.tx}`);
      await refresh();
    });
  };

  useEffect(() => {
    const lamports = toLamports(sendAmount);
    if (!lamports) {
      setFee(null);
      return;
    }
    let cancel = false;
    estimateWithdrawFee(lamports).then(
      (value) => !cancel && setFee(value),
      () => !cancel && setFee(null),
    );
    return () => {
      cancel = true;
    };
  }, [sendAmount]);

  if (!authenticated || !address) {
    return (
      <div className="mt-8">
        <button type="button" className="btn-primary" onClick={() => login()}>
          Connect wallet
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="glass border border-line p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="break-all font-mono text-sm text-paper">{address}</p>
          <button type="button" className="btn-ghost" onClick={() => logout()}>
            Disconnect
          </button>
        </div>
        {ready ? (
          <div className="mt-6">
            <p className="kicker">Private balance</p>
            <p className="mt-2 font-display text-4xl tabular-nums">
              {balance === null ? "…" : sol(balance)} <span className="text-lg text-mist">SOL</span>
            </p>
            <button type="button" className="btn-ghost mt-3" disabled={!!busy} onClick={() => run("Refreshing…", refresh)}>
              Refresh
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm leading-6 text-mist">
              Sign one fixed message to open your private account. It must come from this same wallet
              every time, or deposited funds cannot be recovered.
            </p>
            <button type="button" className="btn-primary mt-4" disabled={!!busy} onClick={onUnlock}>
              {busy ?? "Open private account"}
            </button>
          </div>
        )}
      </div>

      {ready ? (
        <>
          <form className="glass border border-line p-6" onSubmit={onShield}>
            <label htmlFor="shield" className="text-sm text-paper">
              Shield SOL from the wallet
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input id="shield" className="field sm:flex-1" inputMode="decimal" placeholder="0.01" value={shieldAmount} onChange={(e) => setShieldAmount(e.target.value)} />
              <button type="submit" className="btn-primary" disabled={!!busy}>
                Shield
              </button>
            </div>
          </form>

          <form className="glass border border-line p-6" onSubmit={onSend}>
            <label htmlFor="to" className="text-sm text-paper">
              Send privately
            </label>
            <input id="to" className="field mt-3 w-full" autoComplete="off" placeholder="Recipient address" value={to} onChange={(e) => setTo(e.target.value)} />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input className="field sm:flex-1" inputMode="decimal" placeholder="0.01" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
              <button type="submit" className="btn-primary" disabled={!!busy}>
                Send
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-faint">
              {fee !== null ? `Relayer fee about ${sol(fee)} SOL. ` : ""}
              Privacy is stronger when the pool has many deposits. Sending right after you shield is weaker.
            </p>
          </form>
        </>
      ) : null}

      {busy && ready ? <p className="text-sm text-mist">{busy}</p> : null}
      {error ? (
        <p role="alert" className="border border-line p-4 text-sm text-paper">
          {error}
        </p>
      ) : null}
      {note ? <p className="break-all text-sm text-mist">{note}</p> : null}
    </div>
  );
}
