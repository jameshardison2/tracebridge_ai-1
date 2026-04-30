"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, FileJson, Server, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LogsPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchLogs = async () => {
            try {
                const token = await user.getIdToken();
                const res = await fetch("/api/logs", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) {
                    setLogs(json.data);
                }
            } catch (e) {
                console.error("Failed to fetch logs", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [user]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                    <Server className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">System Audit Logs</h1>
                    <p className="text-[var(--muted)] text-sm mt-1">Immutable record of all platform activities and data transformations.</p>
                </div>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-[var(--border)] text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Event Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No audit logs found.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.createdAt._seconds ? log.createdAt._seconds * 1000 : log.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                                log.action === 'analyze' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                log.action === 'upload' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3" />
                                                {log.userId === 'demo-user' ? 'System Service' : log.userId}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2">
                                                <FileJson className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <pre className="text-[10px] font-mono bg-slate-100 text-slate-700 p-2 rounded max-w-sm overflow-x-auto border border-slate-200">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </div>
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
