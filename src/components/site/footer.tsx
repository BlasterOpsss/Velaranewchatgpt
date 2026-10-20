import { Link } from "@tanstack/react-router";
import { Mark, Wordmark } from "@/components/site/mark";

const PRODUCT = [
  { to: "/app", label: "Open the app" },
  { to: "/send", label: "Private send" },
  { to: "/docs", label: "Documentation" },
  { to: "/about", label: "About" },
  { to: "/terms", label: "Terms of Use" },
  { to: "/privacy", label: "Privacy Policy" },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-paper">
            <Mark className="h-8 w-8" />
            <Wordmark className="text-lg" />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-mist">
            Private payments for Solana. Shield SOL, USDC, and USDT, then send to a fresh address
            without an on-chain link to the deposit.
          </p>
        </div>
        <div>
          <p className="text-sm text-paper">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-mist">
            {PRODUCT.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-paper">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm text-paper">The same wallet</p>
          <p className="mt-3 text-sm leading-6 text-mist">
            Your private account opens with a signature from one wallet. That signature stays in
            this browser. Switching wallets can make existing notes unreadable.
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 border-t border-line px-4 py-4 text-center text-xs text-faint sm:px-6">
        <p>VELARA is non-custodial. You approve every signature.</p>
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link to="/terms" className="hover:text-paper">
            Terms of Use
          </Link>
          <Link to="/privacy" className="hover:text-paper">
            Privacy Policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
