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
          <Link href="/" className="font-bold text-gray-900 hover:text-gray-700">Handwerker Agent</Link>
          <Link href="/pipeline" className="text-sm text-gray-600 hover:text-gray-900">Pipeline</Link>
          <Link href="/betriebe" className="text-sm text-gray-600 hover:text-gray-900">Betriebe</Link>
          <Link href="/coldcall" className="text-sm text-gray-600 hover:text-gray-900">Cold Calling</Link>
          <Link href="/demos" className="text-sm text-gray-600 hover:text-gray-900">Demos</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
