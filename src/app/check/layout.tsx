import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#1B2230] font-sans">
      {/* Calm, credible navigation */}
      <header className="bg-[#FFFFFF] border-b border-[#E3E0D8] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-6 shrink-0">
              <Image src="/brand/icon_transparent.png" alt="TraceBridge Icon" fill className="object-contain" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">
              TraceBridge <span className="text-emerald-500">AI</span>
            </span>
          </Link>
          <nav className="flex gap-6 text-sm font-medium">
            <Link href="/check/upload" className="text-[#4A5160] hover:text-emerald-500 transition-colors">1. Upload</Link>
            <Link href="/check/findings" className="text-[#4A5160] hover:text-emerald-500 transition-colors">2. Findings</Link>
            <Link href="/check/export" className="text-[#4A5160] hover:text-emerald-500 transition-colors">3. Review & Export</Link>
          </nav>
        </div>
        <div>
            <Link href="/settings" className="text-sm text-[#4A5160] hover:text-emerald-500 font-medium">Settings</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-8">
        {children}
      </main>
    </div>
  );
}
