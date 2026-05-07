"use client";

import { useState, useEffect } from "react";
import { 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    ExternalLink, 
    ShieldAlert, 
    Network,
    RefreshCw,
    Download
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface TraceabilityItem {
    id: string;
    regulatoryAnchor: {
        id: string;
        topic: string;
        description: string;
    };
    engineeringLink: {
        id: string;
        title: string;
        status: string;
        owner: string;
        url: string;
    };
    aiAnalysis: {
        confidenceScore: number;
        driftRisk: "Low" | "Medium" | "High";
        rationale: string;
    };
    estarStatus: string;
}

export default function TraceabilityMatrixPage() {
    const { user } = useAuth();
    const [data, setData] = useState<TraceabilityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch("/api/traceability", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (error) {
                console.error("Failed to fetch traceability data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const getRiskColor = (risk: string) => {
        if (risk === "Low") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        if (risk === "Medium") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
        if (risk === "High") return "bg-rose-500/10 text-rose-600 border-rose-500/20";
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    };

    const getEstarStatusIcon = (status: string) => {
        if (status === "Ready") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        if (status === "Pending") return <Clock className="w-4 h-4 text-amber-500" />;
        if (status === "Blocked") return <AlertTriangle className="w-4 h-4 text-rose-500" />;
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] flex items-center gap-2">
                        <GitMerge className="w-8 h-8 text-indigo-600" />
                        Dynamic Traceability Matrix
                    </h1>
                    <p className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 tracking-tight mt-2 max-w-2xl">
                        Real-time AI monitoring of your engineering pipeline against FDA regulatory feedback to prevent Q-Sub drift.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                        Resync Jira
                    </button>
                    <button className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-2 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Push to eSTAR
                    </button>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-[var(--border)]">
                                <th className="px-6 py-4 font-semibold text-sm text-slate-700 w-1/4">
                                    FDA Requirement (Anchor)
                                </th>
                                <th className="px-6 py-4 font-semibold text-sm text-slate-700 w-1/4">
                                    Engineering Task (Jira)
                                </th>
                                <th className="px-6 py-4 font-semibold text-sm text-slate-700 w-1/3">
                                    AI Drift Analysis
                                </th>
                                <th className="px-6 py-4 font-semibold text-sm text-slate-700 w-1/6">
                                    eSTAR Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
                                            <span>Analyzing semantic alignment...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No traceability data available. Connect Jira to begin.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        {/* 1. FDA Anchor */}
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                        {item.regulatoryAnchor.id}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-900">
                                                        {item.regulatoryAnchor.topic}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-2">
                                                    {item.regulatoryAnchor.description}
                                                </p>
                                            </div>
                                        </td>

                                        {/* 2. Engineering Link */}
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex flex-col gap-2">
                                                <a 
                                                    href={item.engineeringLink.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline w-fit"
                                                >
                                                    {item.engineeringLink.id}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                                <p className="text-sm text-slate-800 font-medium">
                                                    {item.engineeringLink.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-slate-500">
                                                        Owner: <span className="font-medium text-slate-700">{item.engineeringLink.owner}</span>
                                                    </span>
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {item.engineeringLink.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 3. AI Drift Analysis */}
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${getRiskColor(item.aiAnalysis.driftRisk)}`}>
                                                        {item.aiAnalysis.driftRisk === "High" && <ShieldAlert className="w-3 h-3" />}
                                                        {item.aiAnalysis.driftRisk} Drift Risk
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-slate-500">Confidence:</span>
                                                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full ${
                                                                    item.aiAnalysis.confidenceScore > 80 ? 'bg-emerald-500' :
                                                                    item.aiAnalysis.confidenceScore > 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`}
                                                                style={{ width: `${item.aiAnalysis.confidenceScore}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700">{item.aiAnalysis.confidenceScore}%</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-[var(--border)] shadow-sm">
                                                    <span className="font-semibold text-slate-800">AI Note: </span>
                                                    {item.aiAnalysis.rationale}
                                                </p>
                                            </div>
                                        </td>

                                        {/* 4. eSTAR Status */}
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex items-center gap-2">
                                                {getEstarStatusIcon(item.estarStatus)}
                                                <span className={`text-sm font-medium ${
                                                    item.estarStatus === "Ready" ? "text-emerald-700" :
                                                    item.estarStatus === "Blocked" ? "text-rose-700" : "text-amber-700"
                                                }`}>
                                                    {item.estarStatus}
                                                </span>
                                            </div>
                                            {item.estarStatus === "Blocked" && (
                                                <p className="text-xs text-rose-500 mt-2 font-medium">
                                                    Cannot push to FDA until drift is resolved.
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
