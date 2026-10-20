import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { useSignMessage, useWallets } from "@privy-io/react-auth/solana";
import { Steps } from "@/components/velara/steps";
import { useWalletEnv } from "@/components/privy/provider";
import { fetchWalletBalances } from "@/lib/velara/chain";
import { NETWORK } from "@/lib/velara/network";
import {
  ASSETS,
  type Asset,
  type Balances,
  formatAmount,
  parseAmount,
  shortAddress,
  signMessageFor,
} from "@/lib/velara/model";
import { bookFor, useVelara, type Activity } from "@/lib/velara/store";

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function AccountFlow() {
  const phase = useWalletEnv();
  if (phase !== "ready") return <ConnectPanel phase={phase} />;
  return <AuthedAccount />;
}

function ConnectPanel({ phase }: { phase: "booting" | "unconfigured" }) {
  return (
    <section className="grid gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-[1.2fr_0.8fr]">
      <div className="bg-panel p-6 sm:p-10">
        <h2 className="font-display text-4xl">Connect a wallet to begin</h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-mist">
          Use the wallet you intend to keep. Privy opens the Solana wallet list. After it connects,
          you sign one fixed message. That signature opens the private balance on this browser and
          must come from the same wallet next time.
        </p>
        <p className="mt-4 max-w-lg text-sm leading-7 text-faint">
          {phase === "unconfigured"
            ? "Wallet connection needs a Privy App ID before the modal can open."
            : "Opening Privy…"}
        </p>
        <div className="mt-8">
          <button type="button" className="btn-primary" disabled>
            Connect
          </button>
        </div>
      </div>
      <Steps className="bg-ink p-6 sm:p-10" />
    </section>
  );
}

function AuthedAccount() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const address = wallets[0]?.address ?? null;
  const signed = useVelara((state) => (address ? bookFor(state.books, address).signed : false));

  if (!ready || (authenticated && !address)) {
    return <ConnectPanel phase="booting" />;
  }
  if (!authenticated || !address) {
    return <LoginPanel onConnect={() => login()} />;
  }
  if (!signed) {
    return <SignPanel address={address} onDisconnect={() => void logout()} />;
  }
  return <Workspace address={address} onDisconnect={() => void logout()} />;
}

function LoginPanel({ onConnect }: { onConnect: () => void }) {
  return (
    <section className="grid gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-[1.2fr_0.8fr]">
      <div className="bg-panel p-6 sm:p-10">
        <h2 className="font-display text-4xl">Connect a wallet to begin</h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-mist">
          Use the wallet you intend to keep. After it connects, you sign one fixed message. That
          signature opens the private balance on this browser and must come from the same wallet
          next time.
        </p>
        <p className="mt-4 max-w-lg text-sm leading-7 text-faint">
          Privy connects Phantom, Solflare, Backpack, or an embedded Solana wallet. The signature
          does not spend funds.
        </p>
        <div className="mt-8">
          <button type="button" className="btn-primary" onClick={onConnect}>
            Connect
          </button>
        </div>
      </div>
      <Steps className="bg-ink p-6 sm:p-10" />
    </section>
  );
}

function SignPanel({ address, onDisconnect }: { address: string; onDisconnect: () => void }) {
  const { wallets } = useWallets();
  const { signMessage } = useSignMessage();
  const sign = useVelara((state) => state.sign);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = useRef(true);
  const wallet = wallets.find((item) => item.address === address) ?? wallets[0];

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  async function onSign() {
    if (!wallet) return;
    setPending(true);
    setError(null);
    try {
      const result = await signMessage({
        message: new TextEncoder().encode(signMessageFor(address)),
        wallet,
        options: { uiOptions: { title: "Open your private account" } },
      });
      if (!live.current) return;
      if (!result.signature?.byteLength) {
        setError("The wallet did not return a signature.");
        return;
      }
      sign(address);
    } catch {
      if (live.current) setError("The wallet did not approve the message.");
    } finally {
      if (live.current) setPending(false);
    }
  }

  return (
    <section className="grid gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-[1.2fr_0.8fr]">
      <div className="bg-panel p-6 sm:p-10">
        <h2 className="font-display text-4xl">Sign the fixed message</h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-mist">
          {shortAddress(address)} is connected with Privy. Approving this message opens the private
          balance. It does not spend funds.
        </p>
        <pre className="mt-6 overflow-x-auto border border-line bg-ink p-4 font-mono text-xs leading-6 whitespace-pre-wrap text-mist">
          {signMessageFor(address)}
        </pre>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => void onSign()} disabled={pending}>
            {pending ? "Waiting…" : "Approve signature"}
          </button>
          <button type="button" className="btn-ghost" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
        {error ? (
          <p className="mt-4 text-sm text-mist" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <Steps className="bg-ink p-6 sm:p-10" />
    </section>
  );
}

function Workspace({ address, onDisconnect }: { address: string; onDisconnect: () => void }) {
  const privateBal = useVelara((state) => bookFor(state.books, address).privateBal);
  const activity = useVelara((state) => bookFor(state.books, address).activity);
  const forget = useVelara((state) => state.forget);
  const shield = useVelara((state) => state.shield);
  const [chain, setChain] = useState<Balances | null>(null);
  const [chainState, setChainState] = useState<"loading" | "ready" | "error">("loading");
  const [asset, setAsset] = useState<Asset>("SOL");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmForget, setConfirmForget] = useState(false);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    setChainState("loading");
    fetchWalletBalances(address).then(
      (balances) => {
        if (cancel) return;
        setChain(balances);
        setChainState("ready");
      },
      () => {
        if (!cancel) setChainState("error");
      },
    );
    return () => {
      cancel = true;
    };
  }, [address]);

  const available =
    chainState === "ready" && chain ? Math.max(0, chain[asset] - privateBal[asset]) : 0;

  async function onShield(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNote(null);
    if (chainState !== "ready") {
      setError(
        chainState === "loading" ? "Still reading the wallet." : `Couldn't read this wallet on ${NETWORK}.`,
      );
      return;
    }
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setError("Enter a number, like 1.5.");
      return;
    }
    setPending(true);
    await wait(400);
    const problem = shield(address, asset, parsed, available);
    if (!live.current) return;
    setPending(false);
    if (problem) {
      setError(problem);
      return;
    }
    setAmount("");
    setNote(`${formatAmount(asset, parsed)} ${asset} is now on the private balance in this browser.`);
  }

  const holding =
    chainState === "ready"
      ? `Holds ${formatAmount(asset, available)} ${asset}`
      : chainState === "loading"
        ? "Reading wallet…"
        : "Balance unavailable";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="border border-line bg-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Private balance</p>
            <p className="mt-3 font-mono text-sm text-paper">{shortAddress(address)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={onDisconnect}>
              Disconnect
            </button>
            <button type="button" className="btn-ghost" onClick={() => setConfirmForget(true)}>
              Forget
            </button>
          </div>
        </div>
        {confirmForget ? (
          <div className="mt-6 border border-line bg-ink p-4" role="alert">
            <p className="text-sm text-paper">Forget this browser?</p>
            <p className="mt-1 text-sm leading-6 text-mist">
              This clears the signature, private balance, and activity stored here for this wallet.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => forget(address)}>
                Clear this browser
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirmForget(false)}>
                Keep it
              </button>
            </div>
          </div>
        ) : null}
        <div className="mt-8 grid grid-cols-3 gap-2" role="tablist" aria-label="Asset">
          {ASSETS.map((item) => {
            const selected = item === asset;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setAsset(item);
                  setError(null);
                  setNote(null);
                }}
                className={
                  selected
                    ? "border border-paper bg-ink px-2 py-4 text-left sm:px-3"
                    : "border border-line px-2 py-4 text-left hover:border-paper/40 sm:px-3"
                }
              >
                <span className="text-xs text-faint">{item}</span>
                <span className="mt-2 block font-display text-2xl tabular-nums sm:text-3xl">
                  {formatAmount(item, privateBal[item])}
                </span>
                <span className="mt-1 block text-xs text-mist">private</span>
              </button>
            );
          })}
        </div>
        <form className="mt-8" onSubmit={(event) => void onShield(event)}>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="shield-amount" className="text-sm text-paper">
              Shield from the wallet
            </label>
            <p className="font-mono text-xs text-faint tabular-nums">{holding}</p>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="shield-amount"
              className="field sm:flex-1"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              aria-invalid={error ? true : undefined}
              aria-describedby="shield-help"
              onChange={(event) => setAmount(event.target.value)}
            />
            <button
              type="button"
              className="btn-ghost"
              disabled={chainState !== "ready"}
              onClick={() => setAmount(String(available))}
            >
              Max
            </button>
            <button type="submit" className="btn-primary" disabled={pending || chainState !== "ready"}>
              {pending ? "Shielding…" : `Shield ${asset}`}
            </button>
          </div>
          <p id="shield-help" className="mt-3 text-sm leading-6 text-mist" role={error ? "alert" : undefined}>
            {error ??
              note ??
              "The amount is set aside on the private balance for this wallet. It is not broadcast, so the tokens stay in the connected wallet."}
          </p>
        </form>
        <p className="mt-6 text-sm text-mist">
          Ready to pay someone?{" "}
          <Link to="/send" className="text-paper underline decoration-line underline-offset-4">
            Open transfer
          </Link>
          .
        </p>
      </section>
      <ActivityList activity={activity} />
    </div>
  );
}

function ActivityList({ activity }: { activity: Activity[] }) {
  return (
    <section className="border border-line p-6 sm:p-8">
      <p className="kicker">Activity</p>
      {activity.length === 0 ? (
        <p className="mt-6 text-sm leading-6 text-mist">
          Nothing shielded yet. A shield and a later send get different references, so they do not
          point at each other.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line">
          {activity.map((item) => (
            <li key={item.id} className="py-4 first:pt-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-paper">{item.kind === "shield" ? "Shield" : "Send"}</p>
                <p className="font-display text-2xl tabular-nums">
                  {formatAmount(item.asset, item.amount)}{" "}
                  <span className="font-sans text-sm text-faint">{item.asset}</span>
                </p>
              </div>
              <p className="mt-2 font-mono text-xs leading-5 break-all text-faint">
                {item.kind === "send" && item.to ? `To ${shortAddress(item.to)} · ` : null}
                {item.ref}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
