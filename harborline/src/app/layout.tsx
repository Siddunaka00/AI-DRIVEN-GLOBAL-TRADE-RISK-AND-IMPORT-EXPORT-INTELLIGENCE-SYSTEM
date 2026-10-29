// TradeIQ root layout — clean sans typography (academic redesign). Typography uses curated local/system font stacks (no build-time Google
// Fonts fetch, so `next build` works offline). --font-serif / --font-sans are
// defined here as plain CSS variables consumed by tailwind.config.ts and
// globals.css. Theme is applied pre-paint via an inline script in the <head>
// to avoid a flash of the wrong theme; toggle lives in the top bar.
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TradeIQ — AI-Driven Global Trade Intelligence", template: "%s · TradeIQ" },
  description:
    "AI-driven global trade risk and import-export intelligence system — an academic project demonstrating buyer discovery, duty maths, FTA checking and trade documents, free of charge.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Runs before first paint: restores saved theme. Light is the default for
// visitors with no saved preference (academic redesign brief).
const themeInit = `(function(){try{var t=localStorage.getItem("hl-theme");if(t==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Local/system font stacks exposed as the same CSS variables the
            Tailwind config consumes — no network font fetch at build time. */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              ":root{--font-serif:Georgia,'Iowan Old Style','Palatino Linotype','Book Antiqua',serif;--font-sans:'IBM Plex Sans','Segoe UI',system-ui,-apple-system,Roboto,'Helvetica Neue',Arial,sans-serif}",
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
