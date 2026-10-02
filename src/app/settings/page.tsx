"use client";

import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    return (
        <div className="max-w-3xl mx-auto py-12 px-8">
            <h1 className="font-serif text-3xl mb-8 text-[#1B2230]">Settings</h1>
            
            <div className="bg-[#FFFFFF] p-8 rounded-lg shadow-sm border border-[#E3E0D8]">
                <h3 className="font-bold text-[#1B2230] mb-4">View Toggle</h3>
                <p className="text-sm text-[#4A5160] mb-6">
                    Switch between the legacy Q-Sub AI Dashboard and the new Pre-eSTAR Readiness tool.
                </p>
                
                <div className="flex gap-4">
                    <button className="bg-[#0E6660] text-white px-6 py-2 rounded font-medium text-sm">
                        Pre-eSTAR View (Active)
                    </button>
                    <a href="/dashboard" className="border border-[#E3E0D8] text-[#4A5160] px-6 py-2 rounded font-medium text-sm hover:bg-slate-50">
                        Legacy Q-Sub View
                    </a>
                </div>
            </div>
        </div>
    );
}
