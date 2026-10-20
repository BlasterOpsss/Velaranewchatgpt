import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · VELARA" },
      {
        name: "description",
        content: "VELARA is a non-custodial private balance for SOL, USDC, and USDT.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="kicker">About</p>
      <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">A private balance, still your keys</h1>
      <div className="mt-8 space-y-5 text-sm leading-7 text-mist">
        <p>
          VELARA is a way to hold SOL, USDC, and USDT apart from the address that deposited them,
          then pay a different address. It is non-custodial. You approve every signature. The
          product does not take the keys.
        </p>
        <p>
          The deposit wallet and the receiving address are deliberately not the same record. That
          is the whole point of shielding first and sending second.
        </p>
        <p>
          The same wallet has to sign the fixed message next time. That signature stays in this
          browser. Switching wallets can make existing notes unreadable, so keep the wallet you
          started with.
        </p>
        <p>
          Connect uses Privy. You can attach a Solana wallet you already have, or an embedded
          wallet Privy creates. The fixed message you sign does not move assets. A shield keeps a
          private note for that wallet in this browser and does not submit a transaction. A transfer
          does, and only after the wallet approves it.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/app" className="btn-primary">
          Open the app
        </Link>
        <Link to="/docs" className="btn-ghost">
          Documentation
        </Link>
      </div>
    </article>
  );
}
