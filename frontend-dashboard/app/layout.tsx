import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Handwerker Agent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <span className="font-bold text-gray-900">Handwerker Agent</span>
          <Link href="/pipeline" className="text-sm text-gray-600 hover:text-gray-900">Pipeline</Link>
          <Link href="/betriebe" className="text-sm text-gray-600 hover:text-gray-900">Betriebe</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
