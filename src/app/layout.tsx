import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TraceBridge AI - Regulatory Gap Detection",
  description:
    "Pre-submission audit for FDA 510(k) packages: checks cross-document coherence and flags gaps against FDA guidance, with source citations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} antialiased text-[var(--foreground)] bg-[var(--background)]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
