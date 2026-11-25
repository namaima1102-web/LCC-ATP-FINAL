import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Legend Chicks Cup 2026 · Giải bóng bàn Gà Con",
  description:
    "Hệ thống quản lý giải bóng bàn nội bộ Legend Chicks Cup 2026 (Mùa 5).",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('lcc-theme');
    if (saved !== 'light') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${beVietnamPro.className} flex min-h-screen flex-col antialiased`}
      >
        <div className="flex-1">{children}</div>
        <footer className="border-t border-[var(--border-subtle)]/60 bg-[var(--bg-page)] py-4 text-center text-xs text-[var(--text-muted)]">
          Legend Chicks Cup 2026 ·{" "}
          <span className="font-semibold text-[var(--text-main)]/80">
            Design by Nam Gai
          </span>
        </footer>
      </body>
    </html>
  );
}
