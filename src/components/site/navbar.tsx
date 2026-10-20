import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Menu, X } from "lucide-react";
import { useWalletEnv } from "@/components/privy/provider";
import { Mark, Wordmark } from "@/components/site/mark";
import { IS_DEVNET } from "@/lib/velara/network";
import { shortAddress } from "@/lib/velara/model";
import { bookFor, useVelara } from "@/lib/velara/store";

const LINKS = [
  { to: "/", label: "Home", exact: true },
  { to: "/app", label: "App", exact: false },
  { to: "/private", label: "Private", exact: false },
  { to: "/docs", label: "Docs", exact: false },
  { to: "/about", label: "About", exact: false },
] as const;

function linkClass(extra = "") {
  return `rounded-md px-3 py-2 text-sm text-faint hover:text-paper data-[status=active]:text-paper ${extra}`;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 text-paper" aria-label="VELARA home">
          <Mark className="h-8 w-8" />
          <Wordmark className="text-xl" />
          {IS_DEVNET ? <span className="border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-mist">Devnet test</span> : null}
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className={linkClass()}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          <WalletButton onNavigate={() => setOpen(false)} />
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-t border-line md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-4 py-3 sm:px-6" aria-label="Mobile">
            {LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className={linkClass("px-1 py-3")}
              >
                {item.label}
              </Link>
            ))}
            <div className="py-3">
              <WalletButton onNavigate={() => setOpen(false)} />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function WalletButton({ onNavigate }: { onNavigate: () => void }) {
  const phase = useWalletEnv();
  if (phase !== "ready") {
    return (
      <button type="button" className="btn-primary" disabled={phase === "booting"}>
        Connect
      </button>
    );
  }
  return <LiveWalletButton onNavigate={onNavigate} />;
}

function LiveWalletButton({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate();
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const address = wallets[0]?.address ?? null;
  const signed = useVelara((state) => (address ? bookFor(state.books, address).signed : false));

  if (!ready) {
    return (
      <button type="button" className="btn-primary" disabled>
        Connect
      </button>
    );
  }

  if (!authenticated || !address) {
    return (
      <button
        type="button"
        className="btn-primary"
        onClick={() => {
          onNavigate();
          login();
          void navigate({ to: "/app" });
        }}
      >
        Connect
      </button>
    );
  }

  return (
    <Link to="/app" className="btn-ghost font-mono text-xs" onClick={onNavigate}>
      {signed ? shortAddress(address) : "Sign to open"}
    </Link>
  );
}
