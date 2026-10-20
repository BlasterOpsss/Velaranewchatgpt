import { useEffect, useState, type FormEvent } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSignAndSendTransaction, useWallets, type ConnectedStandardSolanaWallet } from "@privy-io/react-auth/solana";
import { AccountFlow } from "@/components/velara/account";
import { useWalletEnv } from "@/components/privy/provider";
import { fetchWalletBalances } from "@/lib/velara/chain";
import { CHAIN_ID, NETWORK } from "@/lib/velara/network";
import {
  ASSETS,
  type Asset,
  type Balances,
  formatAmount,
  isAddress,
  parseAmount,
  roundAmount,
  shortAddress,
} from "@/lib/velara/model";
import { bookFor, useVelara } from "@/lib/velara/store";
import { buildTransferTransaction, encodeBase58, SOL_FEE_RESERVE } from "@/lib/velara/transfer";

type Draft = { asset: Asset; amount: number; to: string };

export function SendGate() {
  const phase = useWalletEnv();
  if (phase !== "ready") return <AccountFlow />;
  return <AuthedSend />;
}

function AuthedSend() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const wallet = wallets[0] ?? null;
  const address = wallet?.address ?? null;
  const signed = useVelara((state) => (address ? bookFor(state.books, address).signed : false));
  if (!authenticated || !wallet || !address || !signed) return <AccountFlow />;
  return <SendForm address={address} wallet={wallet} signAndSend={signAndSendTransaction} />;
}

function SendForm({
  address,
  wallet,
  signAndSend,
}: {
  address: string;
  wallet: ConnectedStandardSolanaWallet;
  signAndSend: ReturnType<typeof useSignAndSendTransaction>["signAndSendTransaction"];
}) {
  const noteTransfer = useVelara((state) => state.noteTransfer);
  const privateBal = useVelara((state) => bookFor(state.books, address).privateBal);
  const [asset, setAsset] = useState<Asset>("SOL");
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [chain, setChain] = useState<Balances | null>(null);
  const [chainState, setChainState] = useState<"loading" | "ready" | "error">("loading");
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [receipt, setReceipt] = useState<{ asset: Asset; amount: number; to: string; signature: string } | null>(
    null,
  );

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
  }, [address, reload]);

  const shielded = privateBal[asset];
  const spendable =
    chainState === "ready" && chain
      ? Math.max(
          0,
          roundAmount(
            asset,
            (asset === "SOL" ? chain.SOL - SOL_FEE_RESERVE : chain[asset]) - shielded,
          ),
        )
      : 0;

  function onReview(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setReceipt(null);
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setError("Enter a number, like 1.5.");
      return;
    }
    const moved = roundAmount(asset, parsed);
    if (!(moved > 0)) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!isAddress(to)) {
      setError("Enter a Solana address, 32 to 44 characters.");
      return;
    }
    if (chainState !== "ready" || !chain) {
      setError(chainState === "loading" ? "Still reading the wallet." : `Couldn't read this wallet on ${NETWORK}.`);
      return;
    }
    if (moved > spendable + 1e-9) {
      setError(
        asset === "SOL"
          ? `Leave the shielded ${asset} in the wallet, plus ${SOL_FEE_RESERVE} SOL for the fee.`
          : "That includes an amount you shielded. This transfer will not spend it.",
      );
      return;
    }
    if (asset !== "SOL" && chain.SOL < 0.003) {
      setError("Keep at least 0.003 SOL in the wallet. The fee, and a new token account, are paid in SOL.");
      return;
    }
    setDraft({ asset, amount: moved, to: to.trim() });
  }

  async function onApprove() {
    if (!draft) return;
    setPending(true);
    setError(null);
    try {
      const transaction = await buildTransferTransaction(address, draft.to, draft.asset, draft.amount);
      const result = await signAndSend({
        transaction,
        wallet,
        chain: CHAIN_ID,
        options: {
          uiOptions: {
            description: `Send ${formatAmount(draft.asset, draft.amount)} ${draft.asset} to ${shortAddress(draft.to)}. Nothing moves until you approve.`,
            buttonText: "Approve transfer",
          },
        },
      });
      const signature = encodeBase58(result.signature);
      noteTransfer(address, draft.asset, draft.amount, draft.to, signature);
      setReceipt({ ...draft, signature });
      setDraft(null);
      setAmount("");
      setReload((value) => value + 1);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setError(
        /reject|declin|cancel|user/i.test(message)
          ? "You did not approve the transfer. Nothing was sent."
          : message || "The wallet did not send the transfer.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <form className="border border-line bg-panel p-6 sm:p-8" onSubmit={onReview}>
        <p className="kicker">From this wallet</p>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {ASSETS.map((item) => {
            const selected = item === asset;
            const shown = chainState === "ready" && chain ? chain[item] : null;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setAsset(item);
                  setDraft(null);
                }}
                className={
                  selected
                    ? "border border-paper bg-ink px-2 py-3 text-left sm:px-3"
                    : "border border-line px-2 py-3 text-left hover:border-paper/40 sm:px-3"
                }
              >
                <span className="block text-xs text-faint">{item}</span>
                <span className="mt-1 block font-mono text-sm tabular-nums text-paper">
                  {shown === null ? "…" : formatAmount(item, shown)}
                </span>
              </button>
            );
          })}
        </div>
        <label htmlFor="send-amount" className="mt-8 block text-sm text-paper">
          Amount
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="send-amount"
            className="field"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setDraft(null);
            }}
          />
          <button
            type="button"
            className="btn-ghost"
            disabled={chainState !== "ready"}
            onClick={() => {
              setAmount(String(spendable));
              setDraft(null);
            }}
          >
            Max
          </button>
        </div>
        <label htmlFor="send-to" className="mt-6 block text-sm text-paper">
          Recipient
        </label>
        <input
          id="send-to"
          className="field mt-3 font-mono text-sm"
          autoComplete="off"
          spellCheck={false}
          placeholder="Address"
          value={to}
          onChange={(event) => {
            setTo(event.target.value);
            setDraft(null);
          }}
        />
        {draft ? (
          <div className="mt-8 border border-line bg-ink p-4">
            <p className="text-sm text-paper">
              Send {formatAmount(draft.asset, draft.amount)} {draft.asset} to {shortAddress(draft.to)}?
            </p>
            <p className="mt-2 text-sm leading-6 text-mist">
              Approving in your wallet broadcasts this on Solana. Both addresses stay on the transaction.
              Nothing moves if you decline.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" disabled={pending} onClick={() => void onApprove()}>
                {pending ? "Waiting for wallet…" : "Approve in wallet"}
              </button>
              <button type="button" className="btn-ghost" disabled={pending} onClick={() => setDraft(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <button type="submit" className="btn-primary" disabled={pending || chainState !== "ready"}>
              Review transfer
            </button>
          </div>
        )}
        <p className="mt-4 text-sm leading-6 text-mist" role={error ? "alert" : undefined}>
          {error ??
            `The shielded ${formatAmount(asset, shielded)} ${asset} stays in the wallet and is left out of this transfer. It is still visible on-chain. Approving a send publishes the amount you do spend.`}
        </p>
      </form>
      <div className="border border-line p-6 sm:p-8">
        {receipt ? (
          <>
            <p className="kicker">Transaction</p>
            <p className="mt-4 font-display text-4xl tabular-nums">
              {formatAmount(receipt.asset, receipt.amount)}{" "}
              <span className="font-sans text-base text-faint">{receipt.asset}</span>
            </p>
            <p className="mt-4 text-sm leading-6 text-mist">Sent to {shortAddress(receipt.to)} from this wallet.</p>
            <a
              className="mt-4 block font-mono text-xs leading-5 break-all text-paper underline decoration-line underline-offset-4"
              href={`https://solscan.io/tx/${receipt.signature}`}
              target="_blank"
              rel="noreferrer"
            >
              {receipt.signature}
            </a>
          </>
        ) : (
          <>
            <p className="kicker">No transfer yet</p>
            <p className="mt-4 text-sm leading-6 text-mist">
              Review the amount and the address, then approve it in the wallet Privy connected. Declining
              leaves the balance where it is.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
