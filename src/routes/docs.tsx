import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs · VELARA" },
      {
        name: "description",
        content: "How VELARA shielding, the wallet signature, and private send work.",
      },
    ],
  }),
  component: DocsPage,
});

const SECTIONS = [
  {
    id: "balance",
    title: "The private balance",
    body: "Shielding sets an amount aside from the wallet that funded it. A later send pays a different address. The deposit and the withdrawal are not the same record, so one does not point at the other.",
  },
  {
    id: "signature",
    title: "The signature",
    body: "You sign one fixed message with the wallet Privy connected. It does not transfer SOL, USDC, or USDT. The signature stays in this browser, and the same wallet has to produce it again to open the same notes.",
  },
  {
    id: "shield",
    title: "Shield",
    body: "Choose SOL, USDC, or USDT and an amount up to what the connected wallet holds. That amount leaves the spending balance and appears on the private balance. In this preview both numbers are stored on the device.",
  },
  {
    id: "send",
    title: "Send",
    body: "Send pays any Solana address from the connected wallet, not from the private note. You review the amount and the address, then approve the transaction in the wallet. That approval broadcasts it. Solana records both addresses. If you decline, nothing is sent.",
  },
  {
    id: "preview",
    title: "This preview",
    body: "There is no pool and no relayer. Connect opens Privy, which can attach Phantom, Solflare, Backpack, or an embedded Solana wallet. Forget, on the account page, wipes that wallet’s notes from this browser.",
  },
] as const;

function DocsPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="kicker">Documentation</p>
      <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">Read it before you move</h1>
      <p className="mt-5 text-base leading-8 text-mist">
        VELARA holds a private balance apart from the address that deposited it. You approve every
        signature. This site lets you walk the whole path without leaving the browser.
      </p>
      <ol className="mt-10 border-t border-line">
        {SECTIONS.map((section) => (
          <li key={section.id} id={section.id} className="border-b border-line py-8">
            <h2 className="font-display text-3xl">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-mist">{section.body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-sm text-mist">
        <Link to="/app" className="text-paper underline decoration-line underline-offset-4">
          Open the app
        </Link>{" "}
        when you want to try the balance.
      </p>
    </article>
  );
}
