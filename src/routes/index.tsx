import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/site/motion";
import { STEPS, TOKEN_CA, TOKEN_URL, formatAmount, seedPublic } from "@/lib/velara/model";

// TODO: replace with the real Velara X handle.
const X_HANDLE = "velara";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VELARA — Private SOL & Token Payments" },
      {
        name: "description",
        content:
          "Send SOL and tokens privately with VELARA. Shield deposits, hold a private balance, and withdraw without an on-chain link.",
      },
    ],
  }),
  component: Home,
});

const EXAMPLE = seedPublic();

function Home() {
  const [copied, setCopied] = useState(false);

  async function copyCa() {
    try {
      await navigator.clipboard.writeText(TOKEN_CA);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl items-end gap-16 px-4 pt-16 pb-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-24">
        <div className="hero-in">
          <p className="kicker">Private payments on Solana</p>
          <h1 className="mt-5 font-display text-5xl leading-[0.95] text-paper sm:text-7xl">
            Send SOL & Tokens Privately with <span className="shimmer">VELARA</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-mist sm:text-lg">
            Separate the wallet that deposits from the wallet that receives. Shield into a private
            balance, then send SOL, USDC, or USDT with a proof built in your browser.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/app" className="btn-primary">
              Open the app
              <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                <path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </Link>
            <Link to="/docs" className="btn-ghost">
              Documentation
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-3">
            <li>
              <a
                href={`https://x.com/${X_HANDLE}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-line px-3 py-2 text-sm text-paper hover:border-paper/40"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z"
                  />
                </svg>
                <span>@{X_HANDLE}</span>
              </a>
            </li>
          </ul>
          <div className="mt-6 max-w-xl">
            <p className="kicker">Contract</p>
            <p className="mt-3 font-mono text-sm leading-6 break-all text-paper">{TOKEN_CA}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <button type="button" className="text-mist hover:text-paper" onClick={() => void copyCa()}>
                {copied ? "Copied" : "Copy address"}
              </button>
              <a href={TOKEN_URL} target="_blank" rel="noreferrer" className="text-mist hover:text-paper">
                View on Solscan
              </a>
            </div>
          </div>
        </div>
        <Reveal delay={150} className="glass border border-line p-6 sm:p-8">
          <p className="font-mono text-xs tracking-[0.18em] text-faint uppercase">Example balances</p>
          <div className="mt-8 space-y-6">
            {(Object.keys(EXAMPLE) as Array<keyof typeof EXAMPLE>).map((asset) => (
              <div key={asset} className="flex items-baseline justify-between border-b border-line pb-4">
                <span className="text-sm text-faint">{asset}</span>
                <span className="font-display text-4xl tabular-nums">{formatAmount(asset, EXAMPLE[asset])}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
      <section className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal as="li" delay={i * 120} key={step.n} className="glass border border-line p-6 md:p-8">
              <p className="font-mono text-xs text-faint">{step.n}</p>
              <h2 className="mt-3 font-display text-3xl">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-mist">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>
    </>
  );
}
