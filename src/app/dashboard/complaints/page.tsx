"use client";

import AlertsList from "@/components/complaints/AlertsList";
import ComplaintsTable from "@/components/complaints/ComplaintsTable";
import { AlertTriangle, TrendingUp, ShieldAlert } from "lucide-react";

export default function AdverseEventsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Adverse Events & Safety Signals</h1>
                <p className="text-slate-500 mt-2 max-w-3xl">
                    Monitor post-market complaints in real-time. TraceBridge AI automatically classifies incoming reports, extracts failure modes, and flags statistical anomalies (Safety Signals) that may require an MDR or CAPA.
                </p>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Alerts & Trends */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-indigo-500" />
                            <h2 className="font-bold text-slate-800 text-lg">Active Safety Signals</h2>
                        </div>
                        <div className="p-5 bg-slate-50/50 min-h-[300px]">
                            <AlertsList />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            Regulatory Intelligence
                        </h3>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            TraceBridge AI is monitoring incoming complaints against your 510(k) cleared indications for use. Clusters of novel failure modes will automatically trigger a Systemic Trend alert.
                        </p>
                    </div>
                </div>

                {/* Right Column: Complaints Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 text-xl">Recent Complaints Intake</h2>
                        <div className="flex gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
                                Real-time sync active
                            </span>
                        </div>
                    </div>
                    
                    <ComplaintsTable />
                </div>
                
            </div>
        </div>
    );
}
