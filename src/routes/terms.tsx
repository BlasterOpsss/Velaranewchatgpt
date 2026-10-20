import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use · VELARA" },
      { name: "description", content: "Terms for using the VELARA preview." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="kicker">Terms of Use</p>
      <h1 className="mt-3 font-display text-5xl leading-none">Use it as a preview</h1>
      <p className="mt-4 text-sm text-faint">17 October 2026</p>
      <div className="mt-8 space-y-5 text-sm leading-7 text-mist">
        <p>
          A shield, the signature flag, and the activity list live in local storage on your device.
          Those notes are not a wallet, an account, or a claim on SOL, USDC, or USDT.
        </p>
        <p>
          The send page can broadcast a transfer. It does that only after you review the amount and
          the recipient and approve the transaction in your own wallet. Declining sends nothing.
          Check the address before you approve. This app does not recover a transfer.
        </p>
        <p>
          The interface is provided as-is, without custody and without a promise that a future
          version will restore notes created here. You are responsible for how you use privacy
          tools outside this preview.
        </p>
        <p>
          The contract address shown on the home page identifies the project token. It is not a
          deposit address for the private balance.
        </p>
      </div>
    </article>
  );
}
