import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Footer } from "@/components/site/footer";
import { Ribbons } from "@/components/site/motion";
import { Navbar } from "@/components/site/navbar";
import { VelaraPrivy } from "@/components/privy/provider";
import { HydrateVelara } from "@/lib/velara/store";
import appCss from "../styles.css?url";

const FONTS =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Cormorant+Garamond:wght@400;500;600&display=swap";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VELARA" },
      {
        name: "description",
        content:
          "Send SOL and tokens privately with VELARA. Shield deposits, hold a private balance, and withdraw without an on-chain link.",
      },
      { name: "application-name", content: "VELARA" },
      { name: "theme-color", content: "#000000" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: FONTS },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  notFoundComponent: NotFound,
  component: Root,
});

function Root() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <PreviewHostBridge />
        <Ribbons />
        <AuthProvider>
          <VelaraPrivy>
            <HydrateVelara />
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
          >
            Skip to content
          </a>
          <div className="sheen flex min-h-screen flex-col">
            <Navbar />
            <main id="content" className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
          </VelaraPrivy>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="kicker">404</p>
      <h1 className="mt-3 font-display text-4xl">That page is not here</h1>
      <p className="mt-4 text-sm text-mist">The link may be old. The app is still available.</p>
      <Link to="/" className="btn-primary mt-6">
        Back home
      </Link>
    </div>
  );
}
