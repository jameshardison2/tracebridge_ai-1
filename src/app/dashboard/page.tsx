"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
    BarChart3,
    FileText,
    Upload,
    ArrowRight,
    Shield,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Search,
    Loader2
} from "lucide-react";

interface Upload {
    id: string;
    deviceName: string;
    standards: string[];
    status: string;
    createdAt: any;
    documentCount: number;
    gapResultsCount: number;
}

export default function DashboardPage() {
    const [submissions, setSubmissions] = useState<Upload[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const token = await user.getIdToken();
                const r = await fetch("/api/reports", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await r.json();
                if (data.success && data.data.uploads) {
                    setSubmissions(data.data.uploads);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const stats = {
        total: submissions.length,
        complete: submissions.filter((s) => s.status === "complete").length,
        pending: submissions.filter((s) => s.status === "pending").length,
        analyzing: submissions.filter((s) => s.status === "analyzing").length,
    };

    const handleSeedBackdoor = async () => {
        if (!user || !window.confirm("DEVELOPER BACKDOOR: Seed 30 Demo Enterprise Documents?")) return;
        try {
            setLoading(true);
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/seed", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                window.location.reload();
            } else {
                alert("Failed to seed: " + data.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            
            {/* Enterprise Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[var(--border)] pb-4">
                <div>
                    <h1 
                        className="text-2xl font-bold tracking-tight text-[var(--foreground)] uppercase mb-1 cursor-default select-none"
                        onDoubleClick={handleSeedBackdoor}
                    >
                        Quality Regulatory Dashboard
                    </h1>
                    <p className="text-[var(--muted)] text-sm">
                        Master index of IEC 62304 and ISO 14971 active compliance audits.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/upload"
                        className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 shadow-sm"
                    >
                        <Upload className="w-4 h-4" />
                        Initiate Device Audit
                    </Link>
                </div>
            </div>

            {/* Top Stat Ribbon & Search */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Compact Stats Grid */}
                <div className="grid grid-cols-4 border border-[var(--border)] rounded bg-white shadow-sm flex-1">
                    <div className="p-4 border-r border-[var(--border)]">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Total Audits</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900">{stats.total}</span>
                    </div>
                    <div className="p-4 border-r border-[var(--border)]">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Approved Scans</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900">{stats.complete}</span>
                    </div>
                    <div className="p-4 border-r border-[var(--border)]">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Pending</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900">{stats.pending}</span>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Active Processing</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900">{stats.analyzing}</span>
                    </div>
                </div>

            </div>

            {/* Master Audit List - Formal Table */}
            <div className="bg-white border border-[var(--border)] rounded shadow-sm">
                <div className="bg-slate-50 border-b border-[var(--border)] px-4 py-3 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--primary)]" />
                        Master System Query List
                    </h2>
                </div>
                
                <div className="overflow-x-auto w-full">
                    {loading ? (
                        <div className="p-12 text-center text-[var(--muted)] text-sm font-medium">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--primary)]" />
                            Querying Database...
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="p-12 text-center">
                            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm font-medium mb-4">No audit records found in the current index.</p>
                            <Link href="/dashboard/upload" className="text-[var(--primary)] text-sm font-bold hover:underline">
                                Start Initial Record Ingestion &rarr;
                            </Link>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-slate-100">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audit Target / Device</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Regulated Protocol</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Documents Ingested</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Execution Date</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {submissions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-bold text-sm text-slate-900 block truncate max-w-[200px]">
                                                    {sub.deviceName}
                                                </span>
                                                <span className="bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase shadow-sm">
                                                    v1.1
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">ID: {sub.id.substring(0, 8)}</span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {sub.standards?.slice(0,2).map(std => (
                                                    <span key={std} className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">{std.split(':')[0]}</span>
                                                )) || <span className="text-xs text-slate-400">N/A</span>}
                                                {sub.standards?.length > 2 && <span className="text-[10px] text-slate-500">+{sub.standards.length - 2}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 font-medium hidden lg:table-cell">
                                            {sub.documentCount || 0} Files
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 font-mono hidden md:table-cell">
                                            {sub.createdAt?.toDate ? new Date(sub.createdAt.toDate()).toISOString().split('T')[0] : (typeof sub.createdAt === 'string' ? new Date(sub.createdAt).toISOString().split('T')[0] : "Pending")}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                                                sub.status === "complete" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                sub.status === "analyzing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                "bg-red-50 text-red-700 border-red-200"
                                            }`}>
                                                {sub.status === "analyzing" && <Loader2 className="w-3 h-3 animate-spin inline" />}
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {sub.status === "complete" ? (
                                                <Link 
                                                    href={`/dashboard/results?id=${sub.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                                                >
                                                    View Matrix <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">Processing...</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
}
