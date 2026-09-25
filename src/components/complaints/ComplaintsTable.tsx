"use client";

import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChevronDown, ChevronUp, FileText, AlertCircle } from "lucide-react";

export default function ComplaintsTable() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, "complaints"),
            orderBy("received_at", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComplaints(fetched);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="h-64 animate-pulse bg-slate-50"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Component</th>
                            <th className="px-6 py-4">Failure Mode</th>
                            <th className="px-6 py-4">Severity</th>
                            <th className="px-6 py-4 text-center">MDR Required</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {complaints.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No complaints recorded.
                                </td>
                            </tr>
                        ) : complaints.map((complaint) => (
                            <React.Fragment key={complaint.id}>
                                <tr 
                                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedRow === complaint.id ? 'bg-slate-50' : ''}`}
                                    onClick={() => toggleRow(complaint.id)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                        {complaint.received_at?.toDate().toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {complaint.device_component || "Pending..."}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {complaint.failure_type || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {complaint.severity ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                                                ${complaint.severity === 'critical' ? 'bg-red-100 text-red-800' : 
                                                  complaint.severity === 'major' ? 'bg-amber-100 text-amber-800' : 
                                                  'bg-blue-100 text-blue-800'}
                                            `}>
                                                {complaint.severity}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                Processing
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {complaint.needs_mdr ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                                                <AlertCircle className="w-4 h-4" />
                                            </span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-indigo-600">
                                            {expandedRow === complaint.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </button>
                                    </td>
                                </tr>
                                {expandedRow === complaint.id && (
                                    <tr className="bg-slate-50 border-t-0">
                                        <td colSpan={6} className="px-6 py-4 border-b border-slate-200">
                                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                                <div className="flex items-start gap-3">
                                                    <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Original Complaint Text (Source: {complaint.source})</h4>
                                                        <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded border">
                                                            {complaint.raw_text}
                                                        </p>
                                                        
                                                        {complaint.classification_confidence && (
                                                            <div className="mt-4 flex items-center gap-2">
                                                                <span className="text-xs text-slate-500">AI Confidence:</span>
                                                                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full ${complaint.classification_confidence > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                                        style={{ width: `${complaint.classification_confidence}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-medium text-slate-700">{complaint.classification_confidence}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
