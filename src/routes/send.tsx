import { createFileRoute } from "@tanstack/react-router";
import { SendGate } from "@/components/velara/send-panel";

export const Route = createFileRoute("/send")({
  head: () => ({
    meta: [
      { title: "Send · VELARA" },
      {
        name: "description",
        content: "Send SOL, USDC, or USDT from the wallet you connected. Your wallet must approve the transfer.",
      },
    ],
  }),
  component: SendPage,
});

function SendPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="border-b border-line pb-8">
        <p className="kicker">Transfer</p>
        <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">Send from this wallet</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-mist">
          SOL, USDC, or USDT moves only after you approve the transaction in your wallet. Solana records
          the sender and the recipient. Declining sends nothing.
        </p>
      </header>
      <SendGate />
    </div>
  );
}
