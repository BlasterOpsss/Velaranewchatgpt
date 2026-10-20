import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · VELARA" },
      { name: "description", content: "What the VELARA preview stores in this browser." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="kicker">Privacy Policy</p>
      <h1 className="mt-3 font-display text-5xl leading-none">What stays on this device</h1>
      <p className="mt-4 text-sm text-faint">17 October 2026</p>
      <div className="mt-8 space-y-5 text-sm leading-7 text-mist">
        <p>
          There is no account. The preview does not ask for an email, and it does not send your
          balances to a VELARA server.
        </p>
        <p>
          Wallet login is handled by Privy. After you connect, this browser stores whether you
          signed, the private balance, and the activity list, keyed by the Solana address. That
          data sits in local storage under the key velara-demo. Closing the tab does not remove
          it. Privy keeps its own session.
        </p>
        <p>
          Forget, on the account page, deletes that key’s contents and restores the starting demo
          balances. Disconnect only locks the account. The notes remain until you forget them or
          clear site data.
        </p>
        <p>
          Fonts load from Google Fonts. The contract link leaves this site for Solscan, and the
          X link leaves for x.com. Those sites have their own policies.
        </p>
      </div>
    </article>
  );
}
