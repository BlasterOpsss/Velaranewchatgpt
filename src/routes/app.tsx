import { createFileRoute } from "@tanstack/react-router";
import { AccountFlow } from "@/components/velara/account";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "App · VELARA" },
      {
        name: "description",
        content: "Shield SOL, USDC, and USDT, then send them privately with VELARA.",
      },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="border-b border-line pb-8">
        <p className="kicker">Private account</p>
        <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">Hold, then move in private</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-mist">
          Shield SOL, USDC, or USDT into a private balance, then send to a fresh address. Connect
          with Privy, then sign one message. That signature opens the notes for this wallet. It
          does not spend funds.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-faint">
          A shield stays in this browser and does not move tokens. A transfer on the send page does:
          your wallet has to approve it, and Solana broadcasts that transaction.
        </p>
      </header>
      <AccountFlow />
    </div>
  );
}
